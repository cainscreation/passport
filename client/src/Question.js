import React, {Component,useEffect,useState} from "react";
import axios from 'axios';
import "./App.css";

import {useParams} from 'react-router-dom';

function Question() {
    const { id } = useParams();
const[result,SetResult] = useState([]);
const[commentResult,SetCommentResult] = useState([]);

const[comment,SetComment] = useState([]);


const getRepo=()=>{

    axios.get('/question/'+id).then((resp)=>{
        console.log(resp.data);
       SetResult(resp.data);
    }
    );
    fetchComment();

}
const fetchComment=()=>{

    axios.get('/comments/'+id).then((resp)=>{
        // console.log(resp.data);
        SetCommentResult(resp.data);
    });
}

const PostComment=()=>{
    axios.post('/comments'
    // , { headers: {"Authorization" : `Bearer ${token}`} }
    ,{
        qid:id,
        comment:comment,
    })

    SetComment("");
    fetchComment();
}
useEffect(()=>getRepo(),[]);

        return (
        
            <div className="App">
            <div>
            <h1>Doubtnut</h1>
      <h1>comments List</h1>
      {result.map(response => 
      <h4>{response?.question_title}</h4>
      
      )}
                  <div>
                <label>comment</label>
                <input type="Text" onChange={(event)=>{SetComment(event.target.value);}}/>
                <button onClick={PostComment}>Submit Comment</button>
            </div>
            <button onClick={fetchComment}>Comments List</button>
            <div>
                {/* <label>comment</label> */}
                {commentResult.map((response, index) => 
      (
      <h4>{response?.solution_text} from {response?.commentuser}</h4>
      
        )
      )}
            </div>
            </div>
        
            </div>
        )
    
}
export default Question;