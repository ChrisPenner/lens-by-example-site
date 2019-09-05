import React  from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom"

import './App.css';
import './style/syntax.css';
import NavBar from "./components/NavBar"
import Contents from './components/Contents'
import Article from './components/Article'

import firebase from '@firebase/app';
import '@firebase/firestore';
import { FirestoreProvider } from 'react-firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAsIGdr7JUCdXJDSQdEVYjUACut1Tz6CiE",
    projectId: "lens-by-example",
};
firebase.initializeApp(firebaseConfig);

const App = () => (
  <FirestoreProvider firebase={firebase}>
    <Router>
        <div>
        <NavBar />
        <Route exact path="/" component={Contents} />
        <Route exact path="/articles/:section/:slug" component={Article} />
        </div>
    </Router>
  </FirestoreProvider>
);

export default App;


