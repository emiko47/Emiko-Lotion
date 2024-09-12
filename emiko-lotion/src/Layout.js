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

  useEffect(() => {
    // Define an async function to fetch and set the notes
    const fetchNotes = async () => {
        try {
            console.log("You have changed the email to", email);

            // Fetch the notes from the backend
            const notesData = await getNotesFromBackend();

            // Assuming 'notesData' is the array from the backend response
            setNotes(notesData);  // Update the notes state with the retrieved notes

            console.log("Here are the notes:", notesData);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    // Call the fetchNotes function
    if (email) {
        fetchNotes();
    }
}, [email]);  // This will re-run when 'email' changes


  const navigate = useNavigate();
  const mainContainerRef = useRef(null);
  const [collapse, setCollapse] = useState(false);
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(-1);

  async function getNotesFromBackend () {
    //const nurt = note.body.replaceAll("<p><br></p>", "");
    const pack = {email:email}
    try {
      const response = await fetch(`${process.env.REACT_APP_GETNOTES_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(pack)
      });
      

      const data = await response.json();

      if (response.ok) {
          console.log('Retrieved notes from backend', data);
          return data;
      } else if (response.status === 500) {
          console.warn('Failed to retrieve notes from backend:', data.message);
          return [];
      }
  
  } catch (error) {
      console.log('An error retrieving the notes occurred. Please try again.');
      return [];
  }

  }


  async function deleteNoteInBackend (id) {
    const pack = {email:email, id:id}
    try {
      const response = await fetch(`${process.env.REACT_APP_DELETENOTE_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(pack)
      });
      

      const data = await response.json();

      if (response.ok) {
          console.log('Deleted note in backend', data);
        
      } else if (response.status === 500) {
          console.warn('Failed to delete note in backend:', data.message);
          
      }
  
  } catch (error) {
      console.log('An error deleting the note occurred. Please try again.');
     
  }

  }

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(notes));//anytime the notes array changes, it is updated in local storage. Kampekida.
  }, [notes]);

  useEffect(() => {
    if(mainContainerRef.current){
      const height = mainContainerRef.current.offsetHeight;
      mainContainerRef.current.style.maxHeight = `${height}px`;
    }
    const existing = localStorage.getItem(localStorageKey);
    
    if (existing) {
      try {
        setNotes(JSON.parse(existing));//filling in the notes array with the stuff in "existing" from local storage
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

  
  async function saveNoteToBackend (note) {
    //const nurt = note.body.replaceAll("<p><br></p>", "");
    const pack = {email:email, currnote_id: note.id, notebody:note.body, title:note.title, when:note.when}
    try {
      const response = await fetch(`${process.env.REACT_APP_SAVENOTE_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(pack)
      });
      

      const data = await response.json();

      if (response.ok) {
          console.log('Saved note to backend', data);

      } else if (response.status === 500) {
          console.warn('Failed to save note:', data.message);
      }
      else if (response.status === 400) {
        console.warn('Missing required fields:', data.message);
    }
  } catch (error) {
      console.log('An error saving the notes occurred. Please try again.');
  }

  }



  const saveNote = (note, index) => {
    note.body = note.body.replaceAll("<p><br></p>", "");
    setNotes([
      ...notes.slice(0, index),//Creates a new array with all elements before the index (non-inclusive).
      { ...note },//Inserts a copy of the modified note at the index position (using object spread syntax to ensure immutability).
      ...notes.slice(index + 1),//Adds all elements after the index to the array.
    ]);
    setCurrentNote(index);
    //send note to the backend here
    saveNoteToBackend(note);
    //call save note with current note body (just pass note to saveNoteToBackend)
    setEditMode(false);
  };

  
  useEffect(() => {
    const storedUser = localStorage.getItem(localStorageKey);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


  

  const deleteNote = (index, id) => {
    setNotes([...notes.slice(0, index), ...notes.slice(index + 1)]);
    setCurrentNote(0);
    deleteNoteInBackend(id)
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

    //Need to send the new note to the backend here
    //call save note service with new body here
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