// base imports
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash/core';

// material ui imports
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
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
    // marginLeft: "",
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

export default function EditInstance(props) {
  const classes = useStyles();
  const { onClose, open, row } = props;
  const [errors, setErrors] = React.useState({});
  const [helperText, setHelperText] = React.useState({
    name: '',
  });

  // handle form validation
  const validateInputs = inputs => {
    setErrors({});
    setHelperText({});
    if (_.isEmpty(inputs)) {
      onClose();
      return false;
    }
    if (!row.name || !row.domain) {
      if (!inputs.name || !inputs.domain) {
        if (!inputs.name && !row.name) {
          setErrors(errors => ({
            ...errors,
            name: true,
          }));
          setHelperText(helperText => ({
            ...helperText,
            name: 'This field is required.',
          }));
        } else if (!inputs.domain && !row.domain) {
          setErrors(errors => ({
            ...errors,
            domain: true,
          }));
          setHelperText(helperText => ({
            ...helperText,
            domain: 'This field is required.',
          }));
        }
        return false;
      } else {
        return true;
      }
    }
    return true;
  };

  // handle close
  const handleClose = () => {
    onClose();
  };

  const submitData = () => {
    const toSubmit = {
      name: inputs.name ? inputs.name : row.name,
      domain: inputs.domain ? inputs.domain : row.domain,
    };
    let status;
    fetch(`api/v1/instances/${row.id}`, {
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
          onClose(results.data[0]);
          alert('Instance edited successfully.');
        }
        return;
      })
      .catch(error => {
        console.log(error);
        alert(
          'An error occurred. Please try again or contact an administrator.',
        );
      });
    onClose();
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
            <div className={classes.dialogTitleText}>Edit Instance</div>
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
        <TextField
          error={errors && errors.name}
          helperText={helperText.name}
          className={classes.formField}
          id="instance-name"
          label="Instance Name"
          name="name"
          fullWidth
          variant="outlined"
          defaultValue={row.name}
          onChange={handleInputChange}
          value={inputs.name}
        />
        <TextField
          error={errors && errors.domain}
          className={classes.formField}
          id="instance-domain"
          label="Domain"
          name="domain"
          fullWidth
          variant="outlined"
          defaultValue={row.domain}
          onChange={handleInputChange}
          value={inputs.domain}
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

EditInstance.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
};
