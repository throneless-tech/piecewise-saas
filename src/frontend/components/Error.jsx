import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

const Error = ({ error, componentStack, resetErrorBoundary }) => {
  return (
    <Alert severity="error" onClose={resetErrorBoundary} dismissable="true">
      <AlertTitle>Something went wrong:</AlertTitle>
      <pre>{error.message}</pre>
      <pre>{componentStack}</pre>
    </Alert>
  );
};

Error.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
  }).isRequired,
  componentStack: PropTypes.object,
  resetErrorBoundary: PropTypes.func.isRequired,
};

export default Error;
