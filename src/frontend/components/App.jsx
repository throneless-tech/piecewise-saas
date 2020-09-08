// base imports
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import { lazy, LazyBoundary } from 'react-imported-component';
import { ErrorBoundary } from 'react-error-boundary';
import { makeStyles } from '@material-ui/core/styles';
import Cookies from 'js-cookie';

// material ui imports
import Container from '@material-ui/core/Container';

const useStyles = makeStyles(() => ({
  container: {
    padding: 0,
  },
}));

const Basic = lazy(() => import('./Front.jsx'));
const Dashboard = lazy(() => import('./Dashboard.jsx'));
const Loading = lazy(() => import('./Loading.jsx'));
const Login = lazy(() => import('./Login.jsx'));
import Error from './Error.jsx';

const PrivateRoute = ({
  component: Component,
  authed,
  user,
  instance,
  ...rest
}) => {
  const history = useHistory();
  const path = { ...rest };

  if (user) {
    if (user.role !== 1 && path.path === '/dashboard') {
      return (
        <Route
          {...rest}
          render={props => (
            <Dashboard {...props} user={user} instance={instance} />
          )}
        />
      );
    } else {
      return (
        <Route
          {...rest}
          render={props =>
            authed === true ? (
              <Component {...props} user={user} instance={instance} />
            ) : (
              history.push('/login')
            )
          }
        />
      );
    }
  } else {
    return (
      <Route
        {...rest}
        render={props =>
          authed === true ? (
            <Component {...props} user={user} instance={instance} />
          ) : (
            history.push('/login')
          )
        }
      />
    );
  }
};

PrivateRoute.propTypes = {
  component: PropTypes.func.isRequired,
  authed: PropTypes.bool,
  user: PropTypes.object,
};

export default function App() {
  const classes = useStyles();
  const [authenticated, setAuthenticated] = React.useState(false);
  const updateAuthed = authState => {
    setAuthenticated(authState);
  };
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(null);

  const processError = res => {
    let errorString;
    if (res.statusCode && res.error && res.message) {
      errorString = `HTTP ${res.statusCode} ${res.error}: ${res.message}`;
    } else if (res.statusCode && res.status) {
      errorString = `HTTP ${res.statusCode}: ${res.status}`;
    } else if (res.message) {
      errorString = res.message;
    } else {
      errorString = 'Error in response from server.';
    }
    return errorString;
  };

  // fetch api data
  React.useEffect(() => {
    let isMounted = true;
    let userStatus;
    const username = Cookies.get('pws_user');
    if (username) {
      // TODO: Add separate case for admin
      fetch(`api/v1/users/${username}`)
        .then(usersResponse => {
          userStatus = usersResponse.status;
          return usersResponse.json();
        })
        .then(user => {
          if (isMounted) {
            if (userStatus === 200) {
              setAuthenticated(true);
              return setUser(user.role);
            } else {
              const error = processError(user);
              throw new Error(error);
            }
          }
          return;
        })
        .catch(error => {
          setError(error);
          console.error(error.name + error.message);
          // setIsLoaded(true);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setAuthenticated(false);
    }
  }, [authenticated]);

  if (error) {
    return <div>Error: {error}</div>;
  } else {
    return (
      <Container className={classes.container}>
        <ErrorBoundary FallbackComponent={Error}>
          <Switch>
            <LazyBoundary fallback={Loading}>
              <Route path="/" exact component={Basic} />
              <Route
                path="/login"
                render={props => (
                  <Login {...props} onAuthUpdate={updateAuthed} />
                )}
              />
              <PrivateRoute
                authed={authenticated}
                path="/dashboard"
                component={Dashboard}
                user={user}
              />
            </LazyBoundary>
            <Redirect to="/" />
          </Switch>
        </ErrorBoundary>
      </Container>
    );
  }
}
