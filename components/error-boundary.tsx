"use client";

import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

  useEffect(() => {
    // Log the error to the console or an error tracking service
    if (hasError && error) {
      console.error('Caught an error: ', error, errorInfo);
      // You can also log the error to an error tracking service like Sentry or Bugsnag
    }
  }, [hasError, error, errorInfo]);

  if (hasError && error) {
    // Fallback UI
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <h1>Something went wrong.</h1>
        <p>Please try refreshing the page or contact support.</p>
        <details style={{ whiteSpace: 'pre-wrap' }}>
          {error && error.toString()}
          <br />
          {errorInfo?.componentStack}
        </details>
      </div>
    );
  }

  return children;
}
