// base imports
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

// material ui imports
import Autocomplete from '@material-ui/lab/Autocomplete';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

// icons imports
import ClearIcon from '@material-ui/icons/Clear';

// module imports
import Loading from '../Loading.jsx';

const useStyles = makeStyles(() => ({
  cancelButton: {},
  closeButton: {
    marginTop: '15px',
    position: 'absolute',
    right: '0',
    top: '0',
  },
  dialog: {
    position: 'relative',
  },
  dialogTitleRoot: {
    marginTop: '30px',
  },
  dialogTitleText: {
    fontSize: '2.25rem',
    textAlign: 'center',
  },
  form: {
    padding: '50px',
  },
  formControl: {
    width: '100%',
  },
  formField: {
    marginBottom: '30px',
    width: '100%',
  },
  saveButton: {
    marginBottom: '0',
  },
}));

const useForm = callback => {
  const [inputs, setInputs] = useState({});
  const handleSubmit = event => {
    if (event) {
      event.preventDefault();
    }
    callback();
  };
  const handleInputChange = event => {
    event.persist();
    setInputs(inputs => ({
      ...inputs,
      [event.target.name]: event.target.value,
    }));
  };
  return {
    handleSubmit,
    handleInputChange,
    inputs,
  };
};

export default function EditSelf(props) {
  const classes = useStyles();
  const { onClose, open, row } = props;
  const [error, setError] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [instances, setInstances] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [role, setRole] = React.useState(row.role);
  const [roleName, setRoleName] = React.useState(row.role_name);
  const [instance, setInstance] = React.useState(row.instance);
  const [instanceName, setInstanceName] = React.useState(row.instance_name);

  const handleClose = () => {
    onClose();
  };

  const handleRoleChange = (event, values) => {
    setRole(values.id);
    setRoleName(values.name);
  };

  const handleInstanceChange = (event, values) => {
    setInstance(values.id);
    setInstanceName(values.name);
  };

  const submitData = () => {
    const toSubmit = {
      ...inputs,
      instance: instance,
      role: role,
    };

    let status;
    fetch(`api/v1/users/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: toSubmit }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then(results => {
        if (status === 200 || status === 201 || status === 204) {
          alert(`User edited successfully.`);
          onClose({
            ...toSubmit,
            instance_name: instanceName,
            role_name: roleName,
          });
          return;
        } else {
          processError(results);
          throw new Error(`Error in response from server: ${results.message}`);
        }
      })
      .catch(error => {
        console.error(error.name + error.message);
        alert(
          'An error occurred. Please try again or contact an administrator.',
        );
        onClose();
      });
  };

  const { inputs, handleInputChange, handleSubmit } = useForm(submitData);

  const processError = res => {
    let errorString;
    if (res.statusCode && res.error && res.message) {
      errorString = `HTTP ${res.statusCode} ${res.error}: ${res.message}`;
    } else if (res.statusCode && res.status) {
      errorString = `HTTP ${res.statusCode}: ${res.status}`;
    } else if (res) {
      errorString = res;
    } else {
      errorString = 'Error in response from server.';
    }
    return errorString;
  };

  React.useEffect(() => {
    let status;
    fetch('/api/v1/instances')
      .then(res => {
        status = res.status;
        return res.json();
      })
      .then(instances => {
        if (status === 200) {
          setInstances(instances.data);
          return;
        } else {
          processError(instances);
          throw new Error(`Error in response from server.`);
        }
      })
      .then(() => fetch('/api/v1/groups'))
      .then(res => {
        status = res.status;
        return res.json();
      })
      .then(groups => {
        if (status === 200) {
          setGroups(groups.data);
          setIsLoaded(true);
          return;
        } else {
          processError(groups);
          throw new Error(`Error in response from server.`);
        }
      })
      .catch(error => {
        setError(error);
        console.error(error.name + error.message);
        setIsLoaded(true);
      });
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <Loading />;
  } else {
    return (
      <Dialog
        onClose={handleClose}
        modal="true"
        open={open}
        aria-labelledby="edit-user-title"
        fullWidth={true}
        maxWidth={'lg'}
        lassName={classes.dialog}
      >
        <Button
          label="Close"
          primary="true"
          onClick={handleClose}
          className={classes.closeButton}
        >
          <ClearIcon />
        </Button>
        <DialogTitle id="edit-user-title" className={classes.dialogTitleRoot}>
          <div className={classes.dialogTitleText}>Edit User</div>
        </DialogTitle>
        <Box className={classes.form}>
          <TextField
            disabled
            className={classes.formField}
            id="user-username"
            label="Username"
            name="username"
            fullWidth
            variant="outlined"
            defaultValue={row.username}
            onChange={handleInputChange}
            value={inputs.username}
          />
          <TextField
            className={classes.formField}
            id="user-first-name"
            label="First Name"
            name="firstName"
            fullWidth
            variant="outlined"
            defaultValue={row.firstName}
            onChange={handleInputChange}
            value={inputs.firstName}
          />
          <TextField
            className={classes.formField}
            id="user-last-name"
            label="Last Name"
            name="lastName"
            fullWidth
            variant="outlined"
            defaultValue={row.lastName}
            onChange={handleInputChange}
            value={inputs.lastName}
          />
          <TextField
            className={classes.formField}
            id="user-email"
            label="Email"
            name="email"
            fullWidth
            variant="outlined"
            defaultValue={row.email}
            onChange={handleInputChange}
            value={inputs.email}
          />
          <TextField
            className={classes.formField}
            id="user-oldpassword"
            label="Old Password"
            name="oldPassword"
            fullWidth
            type="password"
            variant="outlined"
            defaultValue={row.oldPassword}
            onChange={handleInputChange}
            value={inputs.oldPassword}
          />
          <TextField
            className={classes.formField}
            id="user-newpassword"
            label="New Password"
            name="newPassword"
            fullWidth
            type="password"
            variant="outlined"
            defaultValue={row.newPassword}
            onChange={handleInputChange}
            value={inputs.newPassword}
          />
          {row.role_name === 'admins' ? (
            <Box>
              <FormControl variant="outlined" className={classes.formControl}>
                <Autocomplete
                  id="instance-select"
                  options={instances}
                  getOptionLabel={option => option.name}
                  getOptionSelected={(option, value) => option.name === value}
                  defaultValue={instances.find(
                    instance => instance.id === row.instance,
                  )}
                  onChange={handleInstanceChange}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Instance"
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>
              <Box my={4}>
                <FormControl variant="outlined" className={classes.formControl}>
                  <Autocomplete
                    id="user-role"
                    options={groups}
                    getOptionLabel={option => option.name}
                    getOptionSelected={(option, value) => option.name === value}
                    defaultValue={groups.find(group => group.id === row.role)}
                    onChange={handleRoleChange}
                    renderInput={params => (
                      <TextField {...params} label="Roles" variant="outlined" />
                    )}
                  />
                </FormControl>
              </Box>
            </Box>
          ) : null}
          <Grid container alignItems="center" justify="space-between">
            <Grid item>
              <Button
                size="small"
                label="Cancel"
                primary="true"
                onClick={handleClose}
                className={classes.cancelButton}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button
                type="submit"
                label="Save"
                onClick={handleSubmit}
                className={classes.cancelButton}
                variant="contained"
                disableElevation
                color="primary"
                primary="true"
              >
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Dialog>
    );
  }
}

EditSelf.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
};
