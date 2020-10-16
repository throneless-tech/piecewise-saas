// base imports
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash/core';

// material ui imports
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// icon imports
import ClearIcon from '@material-ui/icons/Clear';

const useStyles = makeStyles(() => ({
  appBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.54)',
    boxShadow: 'none',
  },
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
    // marginTop: "30px",
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
  },
  grid: {
    marginTop: '50px',
  },
  gridItem: {
    marginLeft: '30px',
  },
  inline: {
    marginLeft: '20px',
  },
  saveButton: {
    marginBottom: '0',
  },
  saveButtonContainer: {
    marginBottom: '50px',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  },
}));

const useForm = (callback, validated) => {
  const [inputs, setInputs] = useState({});
  const handleSubmit = event => {
    if (event) {
      event.preventDefault();
    }
    if (validated(inputs)) {
      callback();
      setInputs({});
    }
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

export default function AddInstance(props) {
  const classes = useStyles();
  const { onClose, open } = props;
  const [errors, setErrors] = React.useState({});
  const [helperText, setHelperText] = React.useState({
    name: '',
  });

  // handle form validation
  const validateInputs = inputs => {
    setErrors({});
    setHelperText({});

    const nameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]*$/;

    if (
      !inputs.name ||
      !inputs.domain ||
      !nameRegex.test(inputs.name) ||
      !domainRegex.test(inputs.domain)
    ) {
      if (!inputs.name) {
        setErrors(errors => ({
          ...errors,
          name: true,
        }));
        setHelperText(helperText => ({
          ...helperText,
          name: 'This field is required.',
        }));
      }
      if (inputs.name && !nameRegex.test(inputs.name)) {
        setErrors(errors => ({
          ...errors,
          name: true,
        }));
        setHelperText(helperText => ({
          ...helperText,
          name:
            'Please enter a valid name. Only letters, numbers, - and _ are accepted.',
        }));
      }
      if (!inputs.domain) {
        setErrors(errors => ({
          ...errors,
          domain: true,
        }));
        setHelperText(helperText => ({
          ...helperText,
          domain: 'This field is required.',
        }));
      }
      if (inputs.domain && !domainRegex.test(inputs.domain)) {
        setErrors(errors => ({
          ...errors,
          domain: true,
        }));
        setHelperText(helperText => ({
          ...helperText,
          domain: 'Please enter a valid domain.',
        }));
      }
      return false;
    } else {
      return true;
    }
  };

  // handle api data errors
  const processError = res => {
    let errorString;
    if (res.statusCode && res.error && res.message) {
      errorString = `HTTP ${res.statusCode} ${res.error}: ${res.message}`;
    } else if (res.statusCode && res.status) {
      errorString = `HTTP ${res.statusCode}: ${res.status}`;
    } else {
      errorString = 'Error in response from server.';
    }
    return errorString;
  };

  // handle close
  const handleClose = () => {
    onClose();
  };

  const submitData = () => {
    let status;
    fetch(`api/v1/instances/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: inputs }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then(result => {
        if (status === 201) {
          alert(
            'Instance submitted successfully. Please allow a few minutes for instance set up to complete.',
          );
          onClose(inputs, result.data[0]);
          return;
        } else {
          const error = processError(result);
          throw new Error(`Error in response from server: ${error}`);
        }
      })
      .catch(error => {
        alert(
          'An error occurred. Please try again or contact an administrator.',
        );
        console.error(error.name + error.message);
      });
  };

  const { inputs, handleInputChange, handleSubmit } = useForm(
    submitData,
    validateInputs,
  );

  React.useEffect(() => {}, [errors, helperText]);

  return (
    <Dialog
      onClose={handleClose}
      modal="true"
      open={open}
      aria-labelledby="add-instance-title"
      fullWidth={true}
      maxWidth={'lg'}
      className={classes.dialog}
    >
      <Button
        label="Close"
        primary="true"
        onClick={handleClose}
        className={classes.closeButton}
      >
        <ClearIcon />
      </Button>
      <Grid
        container
        alignItems="center"
        justify="flex-start"
        className={classes.grid}
      >
        <Grid item className={classes.gridItem}>
          <DialogTitle
            id="add-instance-title"
            className={classes.dialogTitleRoot}
          >
            <div className={classes.dialogTitleText}>Add Instance</div>
          </DialogTitle>
        </Grid>
        <Grid item className={classes.gridItem}>
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
        <Grid item className={classes.gridItem}>
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
      </Grid>
      <Box m={4}>
        <Typography variant="overline" display="block" gutterBottom>
          Instance Details
        </Typography>
        <TextField
          error={errors && errors.name}
          helperText={helperText.name}
          className={classes.formField}
          id="instance-name"
          label="Instance Name"
          name="name"
          fullWidth
          variant="outlined"
          onChange={handleInputChange}
          value={inputs.name}
          required
        />
        <TextField
          error={errors && errors.domain}
          helperText={helperText.domain}
          className={classes.formField}
          id="instance-domain"
          label="Domain"
          name="domain"
          fullWidth
          variant="outlined"
          onChange={handleInputChange}
          value={inputs.domain}
          required
        />
        <div className={classes.saveButtonContainer}>
          <Button
            type="submit"
            label="Save"
            onClick={handleSubmit}
            className={classes.saveButton}
            variant="contained"
            disableElevation
            color="primary"
            primary="true"
          >
            Save
          </Button>
        </div>
      </Box>
    </Dialog>
  );
}

AddInstance.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
