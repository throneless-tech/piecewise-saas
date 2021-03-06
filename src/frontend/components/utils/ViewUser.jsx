// base imports
import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Cookies from 'js-cookie';

// material ui imports
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
import MobileStepper from '@material-ui/core/MobileStepper';
import Typography from '@material-ui/core/Typography';

// icons imports
import DeleteIcon from '@material-ui/icons/Delete';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

// modules imports
import EditSelf from '../utils/EditSelf.jsx';
import EditUser from '../utils/EditUser.jsx';

const useStyles = makeStyles(() => ({
  root: {},
  box: {
    padding: '50px',
  },
  closeButton: {
    marginBottom: '50px',
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: '130px',
  },
  closeX: {
    marginTop: '15px',
    position: 'absolute',
    right: '0',
    top: '0',
  },
  dialog: {
    position: 'relative',
  },
  dialogTitleRoot: {
    // marginTop: '30px',
  },
  dialogTitleText: {
    fontSize: '2.25rem',
    textAlign: 'center',
  },
  editButton: {
    margin: '15px',
  },
  form: {
    padding: '50px',
  },
  formField: {
    marginBottom: '30px',
  },
  saveButton: {
    marginBottom: '0',
  },
}));

function formatName(first, last) {
  return `${first} ${last}`;
}

function formatRole(role) {
  if (typeof role === 'string' || role instanceof String) {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export default function ViewUser(props) {
  const classes = useStyles();
  const theme = useTheme();
  const { onClose, onCloseDelete, open, rows, index, user } = props;
  const [row, setRow] = React.useState(rows[index]);
  const [openEdit, setOpenEdit] = React.useState(false);

  // handle prev next
  const [activeStep, setActiveStep] = React.useState(index);
  const maxSteps = rows.length;

  React.useEffect(() => {
    setRow(rows[index]);
    setActiveStep(index);
  }, [index]);

  const handleNext = () => {
    setActiveStep(activeStep => activeStep + 1);
    setRow(rows[activeStep + 1]);
  };

  const handleBack = () => {
    setActiveStep(activeStep => activeStep - 1);
    setRow(rows[activeStep - 1]);
  };

  const handleClose = (row, index) => {
    onClose(row, index);
  };

  // handle edit user
  const isUser = user => {
    if (
      user.username === Cookies.get('pws_user') &&
      user.username === row.username
    ) {
      return (
        <Grid container item xs={12} sm={4} justify="flex-start">
          <Grid item>
            <Button
              variant="contained"
              disableElevation
              color="primary"
              onClick={handleClickOpenEdit}
              className={classes.editButton}
            >
              Edit
            </Button>
            <EditSelf row={user} open={openEdit} onClose={handleCloseEdit} />
          </Grid>
        </Grid>
      );
    } else if (user.role_name === 'admins') {
      return (
        <Grid container item xs={12} sm={4} justify="flex-start">
          <Grid item>
            <Button
              variant="contained"
              disableElevation
              color="primary"
              onClick={handleClickOpenEdit}
              className={classes.editButton}
            >
              Edit
            </Button>
            <EditUser row={row} open={openEdit} onClose={handleCloseEdit} />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              disableElevation
              color="primary"
              onClick={() => handleDelete(row)}
              className={classes.editButton}
            >
              <DeleteIcon />
            </Button>
          </Grid>
        </Grid>
      );
    } else {
      return null;
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this user?')) {
      let status;
      fetch(`api/v1/users/${row.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then(results => {
          if (status === 200) {
            return onCloseDelete(results.data);
          } else {
            const error = processError(results);
            throw new Error(error);
          }
        })
        .catch(error => {
          console.error(error.name + ': ' + error.message);
          alert(
            'An error occurred. Please try again or contact an administrator.',
          );
        });
    } else {
      return;
    }
  };

  const handleClickOpenEdit = () => {
    setOpenEdit(true);
  };

  const handleCloseEdit = rowChanges => {
    const newRow = { ...row, ...rowChanges };
    if (rowChanges) {
      setRow(newRow);
    }
    setOpenEdit(false);
  };

  return (
    <Dialog
      onClose={() => handleClose(row, activeStep)}
      modal="true"
      open={open}
      aria-labelledby="view-user-title"
      fullWidth={true}
      maxWidth={'md'}
      className={classes.dialog}
    >
      <MobileStepper
        steps={maxSteps}
        position="static"
        variant="text"
        activeStep={activeStep}
        nextButton={
          <Button
            size="small"
            onClick={handleNext}
            disabled={activeStep === maxSteps - 1}
          >
            Next
            {theme.direction === 'rtl' ? (
              <KeyboardArrowLeft />
            ) : (
              <KeyboardArrowRight />
            )}
          </Button>
        }
        backButton={
          <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
            {theme.direction === 'rtl' ? (
              <KeyboardArrowRight />
            ) : (
              <KeyboardArrowLeft />
            )}
            Back
          </Button>
        }
      />
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} sm={7}>
          <DialogTitle id="view-user-title" className={classes.dialogTitleRoot}>
            <div className={classes.dialogTitleText}>View User</div>
          </DialogTitle>
        </Grid>
        {isUser(user)}
      </Grid>
      <Box className={classes.box}>
        <Typography component="p" variant="subtitle2" gutterBottom>
          {formatName(row.firstName, row.lastName)}
        </Typography>
        <Typography component="p" variant="body2" gutterBottom>
          {row.email}
        </Typography>
        <Typography component="p" variant="body2" gutterBottom>
          {row.instance_name}
        </Typography>
        <Typography component="p" variant="body2" gutterBottom>
          {formatRole(row.role_name)}
        </Typography>
      </Box>
      <Button
        variant="contained"
        disableElevation
        label="Close"
        color="primary"
        primary="true"
        onClick={() => handleClose(row, activeStep)}
        className={classes.closeButton}
      >
        Close
      </Button>
    </Dialog>
  );
}

ViewUser.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCloseDelete: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  rows: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
};
