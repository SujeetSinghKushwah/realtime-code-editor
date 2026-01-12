import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';

// Language modes
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike'; 
import 'codemirror/mode/xml/xml';     
import 'codemirror/mode/css/css';

import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange, language }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: language, json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,

                    gutters: ["CodeMirror-lint-markers"],
                    lint: true,
                }
            );

            // Jab hum editor mein kuch type karte hain
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code); // EditorPage ki state update karein
                
                // Agar change 'setValue' se nahi aaya (matlab user ne khud type kiya)
                if (origin !== 'setValue') {
                    if (socketRef.current) {
                        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                            roomId,
                            code,
                        });
                    }
                }
            });
        }
        init();
    }, []); // Sirf mount par ek baar chalega

    // Language change ko handle karne ke liye
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setOption('mode', {
                name: language,
                json: true,
            });
        }
    }, [language]);

    // Socket se naya code receive karne ke liye
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    // Wahi code set karein jo socket se aaya hai
                    if (editorRef.current.getValue() !== code) {
                        editorRef.current.setValue(code);
                    }
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            }
        };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;