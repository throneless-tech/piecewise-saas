// base imports
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';

// material ui imports
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Container from '@material-ui/core/Container';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// icons imports
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

export default function Login(props) {
  const history = useHistory();
  const { onAuthUpdate } = props;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [helperText, setHelperText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (username.trim() && password.trim()) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [username, password]);

  const handleKeyPress = e => {
    if (e.keyCode === 13 || e.which === 13) {
      isButtonDisabled || handleLogin();
    }
  };

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

  const handleLogin = async () => {
    // const formData = new FormData();
    // formData.append('username', username);
    // formData.append('password', password);
    // formData.append('remember', remember);

    const json = JSON.stringify({
      data: {
        username: username,
        password: password,
        remember: remember,
      },
    });

    console.log('json: ', json);

    fetch('/api/v1/login', {
      method: 'POST',
      body: json,
    })
      .then(res => res.json())
      .then(results => {
        console.log('results: ', results);
        if (results.success) {
          console.log('in success...');
          setError(false);
          onAuthUpdate(true);
          setHelperText('Login successful.');
          if (results.user.role === 1) {
            return history.push({
              pathname: '/admin',
              state: { user: results.user },
            });
          } else {
            let instanceStatus;
            fetch(`/api/v1/instances?of_user=${results.user.id}`)
              .then(instancesResponse => {
                instanceStatus = instancesResponse.status;
                return instancesResponse.json();
              })
              .then(instances => {
                if (instanceStatus === 200) {
                  return history.push({
                    pathname: '/dashboard',
                    state: {
                      instance: instances.data[0],
                      user: results.user,
                    },
                  });
                } else {
                  const error = processError(instances);
                  throw new Error(error);
                }
              })
              .catch(error => {
                console.error(error.name + error.message);
              });
          }
        } else {
          setError(true);
          setHelperText('Incorrect username or password.');
          return;
        }
        return;
      })
      .catch(error => {
        setError(true);
        setHelperText('Could not connect to authentication server.');
        console.error('error: ', error);
      });
  };

  return (
    <Container component="main" maxWidth="xs">
      <div>
        <Avatar>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form noValidate>
          <TextField
            error={error}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            value={username}
            label="Username"
            autoComplete="username"
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => handleKeyPress(e)}
            autoFocus
          />
          <TextField
            error={error}
            helperText={helperText}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={e => handleKeyPress(e)}
            autoComplete="current-password"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                color="primary"
                onChange={e => setRemember(e.target.checked)}
              />
            }
            label="Remember me"
          />
          <Button
            onClick={() => handleLogin()}
            disabled={isButtonDisabled}
            fullWidth
            variant="contained"
            color="primary"
          >
            Sign In
          </Button>
        </form>
      </div>
    </Container>
  );
}

Login.propTypes = {
  onAuthUpdate: PropTypes.func.isRequired,
};
