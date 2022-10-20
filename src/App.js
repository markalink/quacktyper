import { useEffect, useRef, useState } from 'react';
import './App.css';
//implement timer/wpm
//text border card?
let quoteString;
  let currentIndex = 0;

function App() {
  const QUOTE_API = "http://api.quotable.io/random?minLength=150"; //find api with longer quotes or filter these

  const [testsFinished, setTestsFinished] = useState(0) //differentiate between completed and skipped w/enter
  const [quote, setQuote] = useState([])
  const [render, setRender] = useState(false);
  const inputRef = useRef(null)
  
  function Letter(value, style) {
    this.value = value;
    this.style = style;
  }
  function Word(index, letters) {
    this.index = index
    this.letters = letters
  }
  
  const fetchQuote = async () => {
    return fetch(QUOTE_API).then(response => response.json()).then(data => data.content)
  }

  useEffect(() => {
    newQuote()
    inputRef.current.value = ""
  }, [testsFinished])

  const newQuote = async () => {
    let tempQuote = [];
    quoteString = await fetchQuote();
    // const quoteString = "word"
    const wordArray = quoteString.split(" ")
    let wordLetters = []
    let wordIndex = 0;

    for(let i = 0; i < wordArray.length; i++) {
      wordArray[i].split("").map(char => wordLetters.push(new Letter(char, styles.default)))
      wordLetters.push(new Letter(" ", styles.default))
      tempQuote.push(new Word(wordIndex, wordLetters))
      wordIndex += wordLetters.length
      wordLetters = []
    }
    tempQuote[tempQuote.length - 1].letters.splice(-1, 1)
    setQuote(tempQuote);
  }

  const handleChange = (event) => {
    //finish only when perfect match
    if(event.target.value === quoteString) {
      setTestsFinished(old => old + 1)
    }

    //finish if last key is same
    if(event.target.value.length === quoteString.length && event.target.value[quoteString.length -1] === quoteString[quoteString.length - 1]){
      setTestsFinished(old => old + 1)
    }
  }

  const changeLetterStyle = (index, style) => {
    let tempQuote = quote;
    for(let j = 0; j < tempQuote.length; j++){
      if(tempQuote[j].index > index) {
        tempQuote[j - 1].letters[index - tempQuote[j - 1].index].style = style
        return tempQuote
      }
    }
    tempQuote[tempQuote.length - 1].letters[index - tempQuote[tempQuote.length -1].index].style = style
    setQuote(tempQuote);
  }

  const handleKeyDown = (event) => {
    if(event.key === "Shift" || event.key === "CapsLock"){
      return;
    }
    if(event.key === "Enter"){
      setTestsFinished(old => old + 1)
    }
    else if (event.key === "Backspace") {
      console.log("backspace")
      currentIndex -= 1;
      changeLetterStyle(currentIndex, styles.default)
    }
    else{
      if(event.key === quoteString[currentIndex]){
        changeLetterStyle(currentIndex, styles.correct)
      }
      else {
        changeLetterStyle(currentIndex, styles.incorrect)
      }
      currentIndex += 1;
    }
    setRender(old => !old)
  }

  return (
    <div className="App">

      <div className="Header">
        <h1 className="Title">Quack Typer</h1>
      </div>
      
      <div className="Card">
        {quote && quote?.map((Word, i) => {
          return (
            <div className="Word" key={i * 10 + 5}>
              {
                Word.letters.map((Letter, i) => {
                  if (Letter.value === " ") {
                    return (
                      <span key={i * 10} style={Letter.style === styles.incorrect ? {...Letter.style, textDecoration: "underline", marginTop: "33px"} : {...Letter.style}}>&nbsp;</span>
                    )
                  }
                  else {
                    return (
                      <p key={i * 10} style={Letter.style}>{Letter.value}</p>
                    )
                  }
                })
              }
            </div>
          )
          
        })
        }
      </div>

      <input className="Input" ref={inputRef} type="text" autoFocus onKeyDown={(event) => handleKeyDown(event)} onChange={(event) => handleChange(event)}></input>
      <span style={{color: "white", fontSize: "30px", fontFamily: "Roboto Mono", marginTop: "8vw"}}>{render}</span>
    </div>
  );
}

const styles = {
  default: { color: "#99aab5", fontSize: "30px", fontFamily: "Roboto Mono" },
  correct: { color: "#4CBB17", fontSize: "30px", fontFamily: "Roboto Mono" },
  incorrect: { color: "#e62020", fontSize: "30px", fontFamily: "Roboto Mono" }
}

export default App;
