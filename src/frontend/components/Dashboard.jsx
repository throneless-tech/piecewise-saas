// base imports
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

// material ui imports
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';

//icon imports
import AccountCircle from '@material-ui/icons/AccountCircle';
import IconButton from '@material-ui/core/IconButton';

// modules imports
import NavTabs from './utils/Tabs.jsx';
import EditSelf from './utils/EditSelf.jsx';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    //display: 'flex',
  },
  content: {
    flexGrow: 1,
    height: '100%',
    overflow: 'auto',
  },
  grow: {
    flexGrow: 1,
  },
  toolbar: {
    //paddingRight: 24, // keep right padding when drawer closed
    //maxWidth: '100%',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  title: {
    flexGrow: 1,
  },
  appBarSpacer: theme.mixins.toolbar,
  appBarUserWidget: {
    fontSize: '0.875rem',
    color: 'inherit',
  },
  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      alignItems: 'center',
      display: 'flex',
    },
  },
  sectionMobile: {
    display: 'flex',
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
}));

export default function Dashboard(props) {
  const classes = useStyles();
  const user = props.user || props.location.state.user;
  const [instance, setInstance] = useState(null);
  const [openEditUser, setOpenEditUser] = useState(false);

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

  return (
    <Container className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar className={classes.toolbar}>
          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            Piecewise Login & Admin
          </Typography>
          <div className={classes.grow} />
          <div className={classes.sectionDesktop}>
            <IconButton
              className={classes.appBarUserWidget}
              onClick={() => setOpenEditUser(true)}
            >
              <AccountCircle />
              <Box ml={1}>
                <p>
                  {user.firstName} {user.lastName}
                  <br />
                  {user.role_name}
                </p>
              </Box>
            </IconButton>
            <Box ml={1}>
              <Button
                variant="outlined"
                color="secondary"
                href="/api/v1/logout"
              >
                Log out
              </Button>
            </Box>
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <Container className={classes.container}>
          <NavTabs user={user} instance={instance} />
        </Container>
      </main>
      <EditSelf
        open={openEditUser}
        onClose={() => setOpenEditUser(false)}
        row={user}
      />
    </Container>
  );
}

Dashboard.propTypes = {
  user: PropTypes.object.isRequired,
  instance: PropTypes.object,
  location: PropTypes.object,
};
