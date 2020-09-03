import { BadRequestError } from '../../common/errors.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:model:instance');

export default class InstanceManager {
  constructor(db) {
    this._db = db;
  }

  async create(instance) {
    return this._db
      .table('instances')
      .insert(instance)
      .returning('*');
  }

  async update(id, instance) {
    try {
      let existing = false;
      await this._db.transaction(async trx => {
        existing = await trx('instances')
          .select('*')
          .where({ id: parseInt(id) });

        if (Array.isArray(existing) && existing.length > 0) {
          log.debug('Entry exists, deleting old version.');
          await trx('instances')
            .del()
            .where({ id: parseInt(id) });
          log.debug('Entry exists, inserting new version.');
          await trx('instances').insert({
            ...instance[0],
            id: parseInt(id),
          });
          existing = true;
        } else {
          log.debug('Entry does not already exist, inserting.');
          await trx('instances').insert({
            ...instance[0],
            id: parseInt(id),
          });
          existing = false;
        }
      });
      return existing;
    } catch (err) {
      throw new BadRequestError(
        `Failed to update instance with ID ${id}: `,
        err,
      );
    }
  }

  async delete(id) {
    try {
      await this._db
        .table('instances')
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
    sort_by: sort_by = 'instances.id',
    from: from,
    to: to,
    of_user: of_user,
  }) {
    const rows = await this._db
      .select({
        id: 'instances.id',
        name: 'instances.name',
        domain: 'instances.domain',
        secret: 'instances.secret',
        redirect_uri: 'instances.redirect_uri',
      })
      .from('instances')
      .modify(queryBuilder => {
        if (from) {
          queryBuilder.where('created_at', '>', from);
        }

        if (to) {
          queryBuilder.where('created_at', '<', to);
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
          queryBuilder.limit(end - start + 1);
        }

        if (of_user) {
          queryBuilder.join('instance_users', {
            'instances.id': 'instance_users.iid',
            'instance_users.uid': this._db.raw('?', [of_user]),
          });
        }
      });

    return rows || [];
  }

  async findById(id) {
    return this._db
      .table('instances')
      .select('*')
      .where({ id: parseInt(id) });
  }

  async findAll() {
    return this._db.table('instances').select('*');
  }

  async isMemberOf(lid, uid) {
    log.debug(`Checking if user w/ id ${uid} is a member of instance ${lid}.`);
    const matches = await this._db
      .table('instance_users')
      .select('*')
      .where({ lid: parseInt(lid), uid: parseInt(uid) });

    log.debug('Matching instances: ', matches);

    return matches.length > 0;
  }
}
