import logo from './logo.svg';
import './App.css';
import Login from './login';
import PostQuestion from './question_post';
import {
  BrowserRouter as Router,Routes,
  Switch,
  Route,
  Link
} from "react-router-dom";
import DisplayQuestion from './DisplayQuestion';
import Question from './Question';

function App() {
  return (
    <Router>

    <div className="App">
      <Routes>
      <Route path="/" element={<Login />} />

    <Route path="post" element={<PostQuestion />} />
    <Route path="AllQuestions" element={<DisplayQuestion />} />
    <Route path="/question/:id" element={<Question />}/>
      </Routes>
    </div>
    </Router>
  );
}

export default App;
