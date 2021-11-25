import React, {Component,useEffect,useState} from "react";
import axios from 'axios';
import "./App.css";



function DisplayQuestion() {
const[result,SetResult] = useState([]);

const getRepo=()=>{

    axios.get('/questions').then((resp)=>{
        console.log(resp.data);
       SetResult(resp.data);
    });
}
useEffect(()=>getRepo(),[]);


        return (
            <div className="App">
            <div className="information">
            <h1>Doubtnut</h1>
      <h1>Questions List</h1>
      {result.map(response => 
      <h4>{response?.question_title}</h4>
      
      )}
            </div>
        
            </div>
        )
    
}
export default DisplayQuestion;