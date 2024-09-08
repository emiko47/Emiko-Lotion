import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import NoteList from "./NoteList";
import { v4 as uuidv4 } from "uuid";
import { currentDate } from "./utils";
import Login from "./Login";
import axios from 'axios';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

const localStorageKey = "lotion-v1";



function Layout() {

  const [ user, setUser ] = useState(null);
  const [ profile, setProfile ] = useState(null);
  const [ email, setEmail] = useState(null);


  useEffect(
    () => {
        if (user) {
            axios
                .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                        Accept: 'Loginlication/json'
                    }
                })
                .then((res) => {
                    setProfile(res.data);
                    setEmail(res.data.email);
                })
                .catch((err) => console.log(err));
        }
    },
    [ user ]
  );

  useEffect(
    () => {
        console.log("You have changed the email to ",{email});
    },
    [ email]
  );

  const navigate = useNavigate();
  const mainContainerRef = useRef(null);
  const [collapse, setCollapse] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(-1);

  

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if(mainContainerRef.current){
      const height = mainContainerRef.current.offsetHeight;
      mainContainerRef.current.style.maxHeight = `${height}px`;
    }
    const existing = localStorage.getItem(localStorageKey);
    if (existing) {
      try {
        setNotes(JSON.parse(existing));
      } catch {
        setNotes([]);
      }
    }
  }, []);

  useEffect(() => {
    if (currentNote < 0) {
      return;
    }
    if (!editMode) {
      navigate(`/notes/${currentNote + 1}`);
      return;
    }
    navigate(`/notes/${currentNote + 1}/edit`);
  }, [notes]);

  

  const saveNote = (note, index) => {
    note.body = note.body.replaceAll("<p><br></p>", "");
    setNotes([
      ...notes.slice(0, index),
      { ...note },
      ...notes.slice(index + 1),
    ]);
    setCurrentNote(index);
    setEditMode(false);
  };

  
  useEffect(() => {
    const storedUser = localStorage.getItem(localStorageKey);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


  

  const deleteNote = (index) => {
    setNotes([...notes.slice(0, index), ...notes.slice(index + 1)]);
    setCurrentNote(0);
    setEditMode(false);
  };

  const addNote = () => {
    setNotes([
      {
        id: uuidv4(),
        title: "Untitled",
        body: "",
        when: currentDate(),
      },
      ...notes,
    ]);
    setEditMode(true);
    setCurrentNote(0);
  };

  const logOut = () => {
    googleLogout();
    setProfile(null);
    setEmail(null);
    setUser(null);
    localStorage.removeItem(localStorageKey);
  }

  return (
    <div id="container">
      <header>
      <aside>
        {!profile ?(null ):(
          <button id="menu-button" onClick={() => setCollapse(!collapse)}>
          &#9776;
          </button>
        )}
        </aside>
        <div id="app-header">
          <h1>
            <Link to="/notes">Lotion</Link>
          </h1>
          <h6 id="app-moto">Like Notion, but worse.</h6>
        </div>
        <aside>
        {!profile ?(null ):(
          <button id = "logout-button" onClick = {() => logOut() }>Log Out, {email}</button>
          )
        }
          </aside>
      </header>
      {!profile ?(<Login email = {email} setEmail = {setEmail} user = {user} setUser = {setUser} profile = {profile} setProfile = {setProfile} /> ):(
        <div id="main-container" ref={mainContainerRef}>
        <aside id="sidebar" className={collapse ? "hidden" : null}>
          <header>
            <div id="notes-list-heading">
              <h2>Notes</h2>
              <button id="new-note-button" onClick={addNote}>
                +
              </button>
            </div>
          </header>
          <div id="notes-holder">
            <NoteList notes={notes} />
          </div>
        </aside>
        <div id="write-box">
          <Outlet context={[notes, saveNote, deleteNote]} />
        </div>
      </div>
    
      )}
    </div>
      
  );
}

export default Layout;