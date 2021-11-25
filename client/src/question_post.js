import React, {Component,useState} from "react";
import axios from 'axios';
import "./App.css";


function PostQuestion() {
    const [questionTitle,SetQuestionTitle] = useState("");
const [number,SetNumber] = useState(0);
const [subjectNumber,SetSubjectNumber] = useState(1);

const [questionText,SetQuestionText] = useState("");
const addQuestion =()=>{
    console.log(questionText);

    axios.post('/post_question'
    // , { headers: {"Authorization" : `Bearer ${token}`} }
    ,{
        title:questionTitle,
        class:number,
        additional:questionText,
        subject_id:subjectNumber
    })
}
        return (
            <div className="App">
            <div className="information">
                <label>Question Title</label>
                <input type="Text" onChange={(event)=>{SetQuestionTitle(event.target.value);}}/>
                <label>Class</label>
                <input type="Number" onChange={(event)=>{SetNumber(event.target.value);}}/>
                <label>Question Additional Info</label>
                <input type="Text" onChange={(event)=>{SetQuestionText(event.target.value);}}/>
                <label>Subject ID</label>
                <input type="Number" onChange={(event)=>{SetSubjectNumber(event.target.value);}}/>


                <button onClick={addQuestion}>Submit Question</button>
            </div>
        
            </div>
        )
    
}
export default PostQuestion;