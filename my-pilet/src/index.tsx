import * as React from 'react';
import { Link } from 'react-router-dom';
import type { PiletApi } from 'my-app';

import { withPiletApi } from 'piral-hooks-utils'
const Page = React.lazy(() => import('./Page'));


const WebSocketContext = React.createContext();

export const useWsContext = () => React.useContext(WebSocketContext);

export const WsProvider = ({ piral, children }) => {
  const [connected, setConnected] = React.useState(false);
  const connection = React.useRef(null);
  const retryTimeout = React.useRef(null);
  const retryDelay = React.useRef(1000); // Start with 1 second

  const [stats, setStats] = React.useState({ waiting_count: 0, in_progress_count: 0 })

  const onMessage = (message) => {
    console.log('message received', message)

    // const { data } = JSON.parse(message)
    // const { type, result } = data

    // if (type == "task_success") {
    //   //piral.enqueueSnackbar(result.message, { variant: result.variant });
    //   console.log("MESSAGE")
    // }
    // if (type == "queue_status") {
    //   setStats(data)
    // }
  }


  const connectWs = () => {
    connection.current = new WebSocket('wss://echo.websocket.org');

    connection.current.onopen = () => {
      console.log('connected');
      setConnected(true);
      retryDelay.current = 1000; // Reset after a successful connection

      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
        retryTimeout.current = null;
      }
    };

    connection.current.onmessage = (event) => {
      onMessage(event.data);
    };

    connection.current.onclose = () => {
      console.log('disconnected');
      setConnected(false);


      if (!retryTimeout.current) {
        retryTimeout.current = setTimeout(() => {
          connectWs();
        }, retryDelay.current);

        retryDelay.current = Math.min(retryDelay.current * 2, 30000); // Cap at 30 seconds
      }
    };



    connection.current.onerror = (err) => {
      console.error('WebSocket error', err);
      connection.current.close();
    };
  };

  React.useEffect(() => {
    connectWs();
    console.warn("MOUNT WS PROVIDER")
    return () => {
      console.warn("UN-MOUNT WS PROVIDER")

      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
      if (connection.current) {
        connection.current.close();
      }
    };
  }, []); // Add an empty dependency array to run once on mount

  return (
    <WebSocketContext.Provider value={{ websocket: connection.current }}>
      <div>Websocket {connected ? 'yes' : 'no'} ({stats.waiting_count}) [{stats.in_progress_count}]</div>
      {children}
    </WebSocketContext.Provider>
  );
};

const withWsProvider = (WrappedComponent) => {
  return (props) => (
    <WsProvider piral={props.piral}>
      <WrappedComponent {...props} />
    </WsProvider>
  );
};


const withWsPiletApi = (x) => withWsProvider(withPiletApi(x))



export function setup(app: PiletApi) {
  app.registerPage('/page', withWsPiletApi(Page));
  app.registerPage('/page1', withWsPiletApi(Page));
  app.registerPage('/page2', withWsPiletApi(Page));
  app.registerPage('/page3', withWsPiletApi(Page));

  app.showNotification('Hello from Piral!', {
    autoClose: 2000,
  });
  app.registerMenu(() => <Link to="/page">Page</Link>);
  app.registerTile(() => <div>Welcome to Piral!</div>, {
    initialColumns: 2,
    initialRows: 2,
  });
}
