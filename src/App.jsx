import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import SampleCall from "../../call-web/src/components/App.jsx";
import "./assets/app.css";

var url = new URL(window.location.href);
const query_params = new URLSearchParams(url.search);
var existing_name = query_params.get('name') || 'John Doe';
var existing_user_id = query_params.get('user_id')
var profile_image = 'https://cdn.wnsocial.com/icon-person.png';

function App() {
    const [ms_socket, setMsSocket] = useState(false);
    const [users_list, setUsersList] = useState([]);
    const [name, setName] = useState(existing_name);
    const [user, setUser] = useState({});
    const [show_name_screen, setShowNameScreen] = useState(existing_user_id ? false : true);

    const css_online_offline = {
        display: 'inline-block', 
        width: "10px", 
        height: "10px",
        borderRadius: '100px',
        background: 'green',
        marginLeft: '5px'
    };

    const css_online_offline__offline = {
        background: 'red'
    };
    

    useEffect(() => {
        var ms_socket = io(import.meta.env.VITE_CALL_DEMO_SERVER_URL,{ 
            query: { },
            transports: ["websocket"] 
        });

        setMsSocket(ms_socket);
    }, []);

    useEffect(() => {
        if(!ms_socket) return;

        ms_socket.on('connect', function() {
            console.log('ms_socket connected');

            if(!show_name_screen) {
                joinDemo(existing_user_id);
            }
        });

        ms_socket.on('call-demo:users-list-updated', ({ users }) => {
            console.log('call-demo:users-list-updated', users);

            setUsersList(users);
        });
    }, [ms_socket]);

    const makeCall = (userr) => {
        window.prepareJoinCall({ 
            chat_id: 12345, 
            chat: { id: 12345, call_name: userr.name, call_image: userr.profile_image }, 
            target_user_id: userr.id, 
            current_user: user 
        });
    }

    const joinDemo = (existing_user_id) => {
        var data = { name, profile_image };
        if(existing_user_id) data['id'] = existing_user_id;

        ms_socket.emit('call-demo:join', data, ({ user_id }) => {
            setUser({ 
                id: user_id, 
                name, 
                firstname: name, 
                lastname: '', 
                profile_image
            });

            const url = new URL(window.location);
            url.searchParams.set('user_id', user_id);
            url.searchParams.set('name', name);
            window.history.pushState({}, '', url);
        });

        setShowNameScreen(false);
    }

    return (
        <>
        {
            show_name_screen &&
        
            <div className="name-screen">
                <h3 className="mb-4 text-center">Call Demo</h3>

                <input 
                    type="text" 
                    className="form-control" placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)} 
                />

                <input type="button" className="btn btn-primary mt-2" value="Join" onClick={() => joinDemo()} />
            </div>
        }

        {
            !show_name_screen &&
            
            <div className="users-list-parent">
                <h3 className="mb-4">Demo Users (Logged in as: {name})</h3>
                
                <div className="users-list">
                    {
                        users_list.filter(userr => userr.id !== user.id).map((userr) => (
                            <div key={ userr.id } className="users-list-item">
                                { userr.name } ({ userr.id })

                                {
                                    userr.is_online ? 
                                    
                                    <span style={css_online_offline}></span> 
                                    
                                    : 
                                    
                                    <span style={{ ...css_online_offline, ...css_online_offline__offline }}></span>
                                }
                                
                                {
                                    userr.is_online &&
                                
                                    <button className='btn btn-success btn-sm ml-2' onClick={ () => makeCall(userr) }>Call</button>
                                }
                            </div>
                        ))
                    }
                </div>
            </div>
        }
            
        {
            user.id &&
            
            <div className="call-demo">
                <SampleCall current_user={user} />
            </div>
        }
        </>
    )
}

export default App;