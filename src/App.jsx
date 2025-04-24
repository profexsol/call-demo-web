import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import SampleCall from "../../call-web/src/components/App.jsx";
import "./assets/app.css";

var url = new URL(window.location.href);
const query_params = new URLSearchParams(url.search);
var name = query_params.get('name') || 'John Doe';
var profile_image = 'https://cdn.wnsocial.com/icon-person.png';

function App() {
    const [ms_socket, setMsSocket] = useState(false);
    const [users_list, setUsersList] = useState([]);
    const [user, setUser] = useState({});

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

            ms_socket.emit('call-demo:join', { name: name, profile_image }, ({ user_id }) => {
                setUser({ 
                    id: user_id, 
                    name, 
                    firstname: name, 
                    lastname: '', 
                    profile_image
                });
            });
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

    return (
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
            
            {
                user.id &&
                
                <div className="call-demo">
                    <SampleCall current_user={user} />
                </div>
            }
        </div>
    )
}

export default App;