import bcrypt from 'bcryptjs';
import _ from 'lodash/core';
import { validate } from '../../common/schemas/user.js';
import { BadRequestError, ForbiddenError } from '../../common/errors.js';

function comparePass(userPassword, databasePassword) {
  return bcrypt.compareSync(userPassword, databasePassword);
}

/**
 * Initialize the QueueManager data model
 *
 * @class
 */
export default class User {
  constructor(db) {
    this._db = db;
  }

  async create(user, iid) {
    try {
      await validate(user);
      return this._db.transaction(async trx => {
        const instance = user.instance;
        const role = user.role;
        delete user.instance;
        delete user.role;

        const query = {
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          extension: user.extension,
          role: user.role,
          isActive: user.isActive,
        };

        if (!_.isEmpty(user)) {
          const salt = bcrypt.genSaltSync();
          query.password = bcrypt.hashSync(user.password, salt);
          await trx('users').insert(query);
        }

        let ids = [];
        ids = await trx('users')
          .select()
          .where({ username: user.username });

        if (instance) {
          let iids = [];
          iids = await trx('instances')
            .select('id')
            .where({ id: parseInt(iid ? iid : instance) });

          if (!Array.isArray(iids) || iids.length < 1) {
            throw new BadRequestError('Invalid instance ID.');
          }

          await trx('instance_users')
            .del()
            .where({ uid: ids[0].id });

          await trx('instance_users').insert({
            iid: iids[0].id,
            uid: ids[0].id,
          });
        }

        if (role) {
          let gids = [];
          gids = await trx('groups')
            .select('id')
            .where({ id: parseInt(role) });

          if (!Array.isArray(gids) || gids.length < 1) {
            throw new BadRequestError('Invalid group ID.');
          }

          await trx('user_groups')
            .del()
            .where({ uid: ids[0].id });

          await trx('user_groups').insert({ gid: gids[0].id, uid: ids[0].id });
        }
        return ids;
      });
    } catch (err) {
      throw new BadRequestError('Failed to create user: ', err);
    }
  }

  async update(id, user) {
    try {
      await validate(user);
    } catch (err) {
      throw new BadRequestError('Failed to update user: ', err);
    }
    return this._db.transaction(async trx => {
      const query = {
        username: user.username,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        extension: user.extension,
        isActive: user.isActive,
      };

      if (user.instance) {
        let iids = await trx('instances')
          .select('id')
          .where({ id: parseInt(user.instance) });

        iids = iids ? iids : [];

        if (iids.length < 1) {
          throw new BadRequestError('Invalid instance ID.');
        }

        await trx('instance_users')
          .del()
          .where({ uid: parseInt(id) });

        await trx('instance_users').insert({ iid: iids[0].id, uid: id });
        delete user.instance;
      }

      if (user.role) {
        let gids = await trx('groups')
          .select('id')
          .where({ id: parseInt(user.role) });

        gids = gids ? gids : [];

        if (gids.length < 0) {
          throw new BadRequestError('Invalid group ID.');
        }

        await trx('user_groups')
          .del()
          .where({ uid: parseInt(id) });

        await trx('user_groups').insert({ gid: gids[0].id, uid: id });
        delete user.role;
      }

      if (!_.isEmpty(user)) {
        if (user.password) {
          const salt = bcrypt.genSaltSync();
          query.password = bcrypt.hashSync(user.password, salt);
        }
        return await trx('users')
          .where({ id: parseInt(id) })
          .update(query, [
            'id',
            'firstName',
            'lastName',
            'username',
            'email',
            'phone',
            'extension',
            'isActive',
          ]);
      } else {
        return [id];
      }
    });
  }

  async updateSelf(id, user) {
    try {
      await validate(user, true);
    } catch (err) {
      throw new BadRequestError('Failed to update user: ', err);
    }

    return this._db.transaction(async trx => {
      const query = {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        extension: user.extension,
        isActive: user.isActive,
      };

      if (user.instance) {
        let iids = await trx('instances')
          .select('id')
          .where({ id: parseInt(user.instance) });

        iids = iids ? iids : [];

        if (iids.length < 1) {
          throw new BadRequestError('Invalid instance ID.');
        }

        await trx('instance_users')
          .del()
          .where({ uid: parseInt(id) });

        await trx('instance_users').insert({ iid: iids[0].id, uid: id });
        delete user.instance;
      }

      if (user.role) {
        let gids = await trx('groups')
          .select('id')
          .where({ id: parseInt(user.role) });

        gids = gids ? gids : [];

        if (gids.length < 0) {
          throw new BadRequestError('Invalid group ID.');
        }

        await trx('user_groups')
          .del()
          .where({ uid: parseInt(id) });

        await trx('user_groups').insert({ gid: gids[0].id, uid: id });
        delete user.role;
      }

      try {
        if (user.oldPassword && user.newPassword) {
          //const record = await this.findById(id, true);
          const record = await trx('users')
            .select('*')
            .where({ id: parseInt(id) })
            .first();
          if (!comparePass(user.oldPassword, record.password)) {
            throw new Error('Authentication failed.');
          }
          const salt = bcrypt.genSaltSync();
          const hash = bcrypt.hashSync(user.newPassword, salt);
          query.password = hash;
        }
      } catch (err) {
        throw new ForbiddenError('Failed to update user: ', err);
      }

      if (!_.isEmpty(user)) {
        return await trx('users')
          .where({ id: parseInt(id) })
          .update(query, [
            'id',
            'firstName',
            'lastName',
            'username',
            'email',
            'phone',
            'extension',
            'isActive',
          ]);
      } else {
        return [id];
      }
    });
  }

  async delete(id) {
    try {
      await this._db
        .table('users')
        .del()
        .where({ id: parseInt(id) });
      return id;
    } catch (err) {
      throw new BadRequestError(`Failed to delete device with ID ${id}: `, err);
    }
  }

  async find({
    start: start = 0,
    end: end,
    asc: asc = true,
    sort_by: sort_by = 'users.id',
    from: from,
    to: to,
    instance: instance,
    group: group,
  }) {
    const rows = await this._db
      .select({
        id: 'users.id',
        username: 'users.username',
        firstName: 'users.firstName',
        lastName: 'users.lastName',
        instance: 'instances.id',
        instance_name: 'instances.name',
        instance_domain: 'instances.domain',
        role: 'groups.id',
        role_name: 'groups.name',
        email: 'users.email',
        phone: 'users.phone',
        extension: 'users.extension',
        isActive: 'users.isActive',
      })
      .from('users')
      .leftJoin('instance_users', 'users.id', 'instance_users.uid')
      .leftJoin('instances', 'instances.id', 'instance_users.iid')
      .leftJoin('user_groups', 'users.id', 'user_groups.uid')
      .leftJoin('groups', 'groups.id', 'user_groups.gid')
      .modify(queryBuilder => {
        if (from) {
          queryBuilder.where('created_at', '>', from);
        }

        if (to) {
          queryBuilder.where('created_at', '<', to);
        }

        if (instance) {
          queryBuilder.where('instances.id', '=', instance);
        }

        if (group) {
          queryBuilder.where('role', '=', group);
        }

        if (asc) {
          queryBuilder.orderBy(sort_by, 'asc');
        } else {
          queryBuilder.orderBy(sort_by, 'desc');
        }

        if (start > 0) {
          queryBuilder.offset(start);
        }

        if (end && end > start) {
          queryBuilder.limit(end - start);
        }
      });

    return rows || [];
  }

  /**
   * Find user by Id
   *
   * @param {integer} id - Find user by id
   */
  async findById(id, privileged = false) {
    if (privileged) {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          password: 'users.password',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instance_name: 'instances.name',
          instance_domain: 'instances.domain',
          role: 'groups.id',
          role_name: 'groups.name',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .leftJoin('user_groups', 'users.id', 'user_groups.uid')
        .leftJoin('groups', 'groups.id', 'user_groups.gid')
        .where({ 'users.id': parseInt(id) });
    } else {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instance_name: 'instances.name',
          instance_domain: 'instances.domain',
          role: 'groups.id',
          role_name: 'groups.name',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .leftJoin('user_groups', 'users.id', 'user_groups.uid')
        .leftJoin('groups', 'groups.id', 'user_groups.gid')
        .where({ 'users.id': parseInt(id) });
    }
  }

  /**
   * Find user by Id
   *
   * @param {integer} id - Find user by id
   */
  async findByUsername(username, privileged = false) {
    if (privileged) {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          password: 'users.password',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instance_name: 'instances.name',
          instance_domain: 'instances.domain',
          role: 'groups.id',
          role_name: 'groups.name',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .leftJoin('user_groups', 'users.id', 'user_groups.uid')
        .leftJoin('groups', 'groups.id', 'user_groups.gid')
        .where({ 'users.username': username })
        .first();
    } else {
      return this._db
        .select({
          id: 'users.id',
          username: 'users.username',
          firstName: 'users.firstName',
          lastName: 'users.lastName',
          instance: 'instances.id',
          instance_name: 'instances.name',
          instance_domain: 'instances.domain',
          role: 'groups.id',
          role_name: 'groups.name',
          email: 'users.email',
          phone: 'users.phone',
          extension: 'users.extension',
          isActive: 'users.isActive',
        })
        .from('users')
        .leftJoin('instance_users', 'users.id', 'instance_users.uid')
        .leftJoin('instances', 'instances.id', 'instance_users.iid')
        .leftJoin('user_groups', 'users.id', 'user_groups.uid')
        .leftJoin('groups', 'groups.id', 'user_groups.gid')
        .where({ 'users.username': username })
        .first();
    }
  }

  /**
   * Find user by username
   *
   * @param {integer} username - Find user by username
   */
  async findAll() {
    return this._db.table('users').select('*');
  }

  async addToInstance(iid, id) {
    return await this._db.transaction(async trx => {
      let iids = [];
      iids = await trx('instances')
        .select()
        .where({ id: parseInt(iid) });

      if (iids.length === 0) {
        throw new BadRequestError('Invalid instance ID.');
      }

      let ids = [];
      ids = await trx('users')
        .select()
        .where({ id: parseInt(id) });

      if (ids.length === 0) {
        throw new BadRequestError('Invalid user ID.');
      }
      await trx('instance_users')
        .del()
        .where({ uid: parseInt(id) });

      await trx('instance_users').insert({ iid: iid, uid: id });
    });
  }

  async removeFromInstance(iid, id) {
    return this._db
      .table('instance_users')
      .del()
      .where({ iid: parseInt(iid) })
      .andWhere({ uid: parseInt(id) })
      .returning('*');
  }
}
