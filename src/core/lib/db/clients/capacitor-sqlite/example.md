https://github.com/capacitor-community/sqlite


Ionic/React App
copy manually the file sql-wasm.wasm from node_modules/sql.js/dist/sql-wasm.wasm to the public/assets folder of YOUR_APP

For databases in the public/assets/databases folder if any, you have to create a databases.json file which includes only the non-encrypted database's names

{
  "databaseList" : [
    "YOUR_DB1.db",
    "YOUR_DB2.db",
    ...
  ]
}
open the index.tsx file and add the following
...
import { defineCustomElements as jeepSqlite, applyPolyfills, JSX as LocalJSX  } from "jeep-sqlite/loader";
import { HTMLAttributes } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

type StencilToReact<T> = {
  [P in keyof T]?: T[P] & Omit<HTMLAttributes<Element>, 'className'> & {
    class?: string;
  };
} ;

declare global {
  export namespace JSX {
    interface IntrinsicElements extends StencilToReact<LocalJSX.IntrinsicElements> {
    }
  }
}

applyPolyfills().then(() => {
    jeepSqlite(window);
});

window.addEventListener('DOMContentLoaded', async () => {
  const platform = Capacitor.getPlatform();
  const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite)
  try {
    if(platform === "web") {
      // add 'jeep-sqlite' Stencil component to the DOM
      const jeepEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepEl);
      await customElements.whenDefined('jeep-sqlite');
      // initialize the web store
      await sqlite.initWebStore();
    }
    // initialize some database schema if needed
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_issue10")).result;
    var db: SQLiteDBConnection
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("db_issue10");
    } else {
      db = await sqlite.createConnection("db_issue10", false, "no-encryption", 1);
    }
    await db.open();
    let query = `
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
    `
    const res: any = await db.execute(query);
    await db.close();
     await sqlite.closeConnection("db_issue10");
    
    // launch the React App
    ReactDOM.render(
      <React.StrictMode>
        <App /> 
      </React.StrictMode>,
      document.getElementById('root')
    );

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();

  } catch (err) {
    console.log(`Error: ${err}`);
    throw new Error(`Error: ${err}`)
  }

});
open the App.tsx file
import React, { useState, useRef }  from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import { useSQLite } from 'react-sqlite-hook/dist';
import ModalJsonMessages from './components/ModalJsonMessages';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';


// Singleton SQLite Hook
export let sqlite: any;
// Existing Connections Store
export let existingConn: any;
// Is Json Listeners used
export let isJsonListeners: any;

const App: React.FC = () => {
  const [existConn, setExistConn] = useState(false);
  existingConn = {existConn: existConn, setExistConn: setExistConn};
  const [jsonListeners, setJsonListeners] = useState(false);
  isJsonListeners = {jsonListeners: jsonListeners, setJsonListeners: setJsonListeners};
  const [isModal,setIsModal] = useState(false);
  const message = useRef("");
  const onProgressImport = async (progress: string) => {
    if(isJsonListeners.jsonListeners) {
      if(!isModal) setIsModal(true);
      message.current = message.current.concat(`${progress}\n`);
    }
  }
  const onProgressExport = async (progress: string) => {
    if(isJsonListeners.jsonListeners) {
      if(!isModal) setIsModal(true);
      message.current = message.current.concat(`${progress}\n`);
    }
  }
  // !!!!! if you do not want to use the progress events !!!!!
  // since react-sqlite-hook 2.1.0
  // sqlite = useSQLite()
  // before
  // sqlite = useSQLite({})
  // !!!!!                                               !!!!!

  sqlite = useSQLite({
    onProgressImport,
    onProgressExport
  });
  const handleClose = () => {
    setIsModal(false);
    message.current = "";
  }
  
  return (
  <IonApp>
    <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/tab1" component={Tab1} exact={true} />
            <Route path="/tab2" component={Tab2} exact={true} />
            <Route path="/tab3" component={Tab3} />
            <Route path="/" render={() => <Redirect to="/tab1" />} exact={true} />
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="tab1" href="/tab1">
              <IonIcon icon={triangle} />
              <IonLabel>Tab 1</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab2" href="/tab2">
              <IonIcon icon={ellipse} />
              <IonLabel>Tab 2</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab3" href="/tab3">
              <IonIcon icon={square} />
              <IonLabel>Tab 3</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
    </IonReactRouter>
    { isModal
      ? <ModalJsonMessages close={handleClose} message={message.current}></ModalJsonMessages>
      : null
    }
  </IonApp>
  )
};

export default App;
open a component YOUR_COMPONENT.tsx file
import React, { useState, useEffect, useRef } from 'react';
import './NoEncryption.css';
import { IonCard,IonCardContent } from '@ionic/react';
import { createTablesNoEncryption, importTwoUsers,
        dropTablesTablesNoEncryption } from '../Utils/noEncryptionUtils';
      
import { sqlite } from '../App';
import { SQLiteDBConnection} from 'react-sqlite-hook/dist';
import { deleteDatabase } from '../Utils/deleteDBUtil';     
import { Dialog } from '@capacitor/dialog';

const NoEncryption: React.FC = () => {
    const [log, setLog] = useState<string[]>([]);
    const errMess = useRef("");
    const showAlert = async (message: string) => {
        await Dialog.alert({
          title: 'Error Dialog',
          message: message,
        });
    };

    useEffect( () => {
        const testDatabaseNoEncryption = async (): Promise<Boolean>  => {
            setLog((log) => log.concat("* Starting testDatabaseNoEncryption *\n"));
            try {
                // test the plugin with echo
                let res: any = await sqlite.echo("Hello from echo");
                if(res.value !== "Hello from echo"){
                    errMess.current = `Echo not returning "Hello from echo"`;
                    return false;
                }
                setLog((log) => log.concat("> Echo successful\n"));
                // create a connection for NoEncryption
                let db: SQLiteDBConnection = await sqlite.createConnection("NoEncryption");
                // check if the databases exist 
                // and delete it for multiple successive tests
                await deleteDatabase(db);         
                // open NoEncryption
                await db.open();
                setLog((log) => log.concat("> open 'NoEncryption' successful\n"));

                // Drop tables if exists
                res = await db.execute(dropTablesTablesNoEncryption);
                if(res.changes.changes !== 0 &&
                            res.changes.changes !== 1){
                    errMess.current = `Execute dropTablesTablesNoEncryption changes < 0`;
                    return false;
                } 
                setLog((log) => log.concat(" Execute1 successful\n"));
                
                // Create tables
                res = await db.execute(createTablesNoEncryption);
                if (res.changes.changes < 0) {
                    errMess.current = `Execute createTablesNoEncryption changes < 0`;
                    return false;
                }
                setLog((log) => log.concat(" Execute2 successful\n"));

                // Insert two users with execute method
                res = await db.execute(importTwoUsers);
                if (res.changes.changes !== 2) {
                    errMess.current = `Execute importTwoUsers changes != 2`;
                    return false;
                }
                setLog((log) => log.concat(" Execute3 successful\n"));

                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 2 ||
                res.values[0].name !== "Whiteley" ||
                            res.values[1].name !== "Jones") {
                    errMess.current = `Query not returning 2 values`;
                    return false;
                }
                setLog((log) => log.concat(" Select1 successful\n"));

                // add one user with statement and values              
                let sqlcmd = "INSERT INTO users (name,email,age) VALUES (?,?,?)";
                let values: Array<any>  = ["Simpson","Simpson@example.com",69];
                res = await db.run(sqlcmd,values);
                if(res.changes.changes !== 1 ||
                                res.changes.lastId !== 3) {
                    errMess.current = `Run lastId != 3`;
                    return false;
                }
                setLog((log) => log.concat(" Run1 successful\n"));

                // add one user with statement              
                sqlcmd = `INSERT INTO users (name,email,age) VALUES `+
                                `("Brown","Brown@example.com",15)`;
                res = await db.run(sqlcmd);
                if(res.changes.changes !== 1 ||
                            res.changes.lastId !== 4) {
                    errMess.current = `Run lastId != 4`;
                    return false;
                }
                setLog((log) => log.concat(" Run2 successful\n"));

                // Select all Users
                res = await db.query("SELECT * FROM users");
                if(res.values.length !== 4) {
                    errMess.current = `Query not returning 4 values`;
                    return false;
                }
                setLog((log) => log.concat(" Select2 successful\n"));

                // Select Users with age > 35
                sqlcmd = "SELECT name,email,age FROM users WHERE age > ?";
                values = ["35"];
                res = await db.query(sqlcmd,values);
                if(res.values.length !== 2) {
                    errMess.current = `Query > 35 not returning 2 values`;
                    return false;
                }
                setLog((log) => log
                        .concat(" Select with filter on age successful\n"));

                // Close Connection NoEncryption        
                await sqlite.closeConnection("NoEncryption"); 
                        
                return true;
            } catch (err) {
                errMess.current = `${err.message}`;
                return false;
            }
        }
        if(sqlite.isAvailable) {
            testDatabaseNoEncryption().then(async res => {
                if(res) {    
                    setLog((log) => log
                        .concat("\n* The set of tests was successful *\n"));
                } else {
                    setLog((log) => log
                        .concat("\n* The set of tests failed *\n"));
                    await showAlert(errMess.current);
                }
            });
        } else {
            sqlite.getPlatform().then((ret: { platform: string; })  =>  {
                setLog((log) => log.concat("\n* Not available for " + 
                                    ret.platform + " platform *\n"));
            });         
        }
         
      }, [errMess]);   
    
      
  return (
        <IonCard className="container-noencryption">
            <IonCardContent>
                <pre>
                    <p>{log}</p>
                </pre>
                {errMess.current.length > 0 && <p>{errMess.current}</p>}
            </IonCardContent>
        </IonCard>
  );
};

export default NoEncryption;
follow the capacitor build process
npx cap sync
npm run build
npx cap copy web
npm run start