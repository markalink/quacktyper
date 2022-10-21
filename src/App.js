import { useEffect, useRef, useState } from 'react';
import './App.css';
//implement timer/wpm
//text border card?
let quoteString;
let inputValue;
let mistakeCount;
let prevIncorrectChars;
let correctChars;
let incorrectChars;
//let currentIndex = 0; for single character update implementation
let timerStarted = false;
let isFinished;
let currentTime;
let testResults = [];

function App() {
  const QUOTE_API = "https://quotable.io/random?minLength=150"; //find api with longer quotes or filter these

  const [renderNewQuote, setRenderNewQuote] = useState(false)
  const [renderText, setRenderText] = useState(false);
  // const [testResults, setTestResults] = useState([]) //differentiate between completed and skipped w/enter
  const [quote, setQuote] = useState([])
  const [accuracy, setAccuracy] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const inputRef = useRef(null)
  const showInputRef = useRef(null)

  const [isChecked, setIsChecked] = useState(true)

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
    stopTimer()
    newQuote()
    inputRef.current.value = ""
    currentTime = 0
    correctChars = 0
    mistakeCount = 0
    prevIncorrectChars = 0
    timerStarted = false
    isFinished = false
  }, [renderNewQuote])

  const newQuote = async () => {
    let tempQuote = [];
    quoteString = await fetchQuote(); //deal with this character — replace with -
    quoteString = quoteString.replace("—","-")
    // quoteString = "word"
    const wordArray = quoteString.split(" ")
    let wordLetters = []
    let wordIndex = 0;

    for (let i = 0; i < wordArray.length; i++) {
      wordArray[i].split("").map(char => wordLetters.push(new Letter(char, styles.default)))
      wordLetters.push(new Letter(" ", styles.default))
      tempQuote.push(new Word(wordIndex, wordLetters))
      wordIndex += wordLetters.length
      wordLetters = []
    }
    tempQuote[tempQuote.length - 1].letters.splice(-1, 1)
    setQuote(tempQuote);
    // currentIndex = 0; for single character update implementation
  }

  let startTime;
  const [intervalId, setIntervalId] = useState()
  const startTimer = () => {
    startTime = new Date()
    setIntervalId(setInterval(() => {
      currentTime = (new Date() - startTime) / 1000
      setWpm(correctChars / 5 / currentTime * 60)
      setAccuracy((correctChars) / (correctChars + incorrectChars + mistakeCount) * 100)
    }, 500)
    )
  }
  const stopTimer = () => {
    clearInterval(intervalId)
  }

  const handleChange = (event) => {
    inputValue = event.target.value;

    correctChars = 0;
    incorrectChars = 0;
    for (let i = 0; i < quoteString.length; i++) {
      if (i > inputValue.length - 1) {
        changeLetterStyle(i, styles.default)
      }
      else if (quoteString[i] === inputValue[i]) {
        changeLetterStyle(i, styles.correct)
        correctChars += 1
      }
      else {
        changeLetterStyle(i, styles.incorrect)
        incorrectChars += 1
      }
    }
    if(incorrectChars > prevIncorrectChars){
      mistakeCount += incorrectChars - prevIncorrectChars;
    }
    prevIncorrectChars = incorrectChars
    checkIsFinished()
    setWpm(correctChars / 5 / currentTime * 60)
    setRenderText(old => !old)
  }

  const changeLetterStyle = (index, style) => {
    if (index > quoteString.length - 1 || isFinished) {
      return;
    }
    let tempQuote = quote;
    for (let j = 0; j < tempQuote.length; j++) {
      if (tempQuote[j].index > index) {
        tempQuote[j - 1].letters[index - tempQuote[j - 1].index].style = style
        setQuote(tempQuote)
        return;
      }
    }
    tempQuote[tempQuote.length - 1].letters[index - tempQuote[tempQuote.length - 1].index].style = style
    setQuote(tempQuote);
  }

  const checkIsFinished = () => {
    if (inputValue.length === quoteString.length && inputValue[quoteString.length - 1] === quoteString[quoteString.length - 1]) {
      testResults.push(wpm)
      let sum = 0
      testResults.forEach(wpm => sum += wpm)
      setAvgWpm(sum / testResults.length)
      isFinished = true;
      stopTimer()
    }
  }

  const handleKeyDown = (event) => {
    if (ignoreKeys.includes(event.key)) {
      return;
    }
    if (!timerStarted && currentTime === 0) {
      startTimer();
      timerStarted = true;
    }
    if (event.key === "Enter") {
      setRenderNewQuote(old => !old)
    }
    //only changes the letter pressed, problem with ctrl backspace not working
    // else if (event.key === "Backspace") {
    //   if (currentIndex > 0) {
    //     currentIndex -= 1;
    //     changeLetterStyle(currentIndex, styles.default)
    //   }
    // }
    // else {
    //   if (event.key === quoteString[currentIndex]) {
    //     changeLetterStyle(currentIndex, styles.correct)
    //   }
    //   else {
    //     changeLetterStyle(currentIndex, styles.incorrect)
    //   }
    //   currentIndex += 1;
    // }
    // setRenderText(old => !old)
  }

  return (
    <div className="App">

      <div className="Header">
        <h1 className="Title">Quack Typer</h1>
        <span style={{...styles.default, position: "absolute", left: "3%", top: "5%"}}>Avg: {avgWpm.toFixed(2)}</span>
      </div>
      <span style={{...styles.default, marginTop: "-2%", marginBottom: "2%"}}>Wpm: {wpm.toFixed(2)} Accuracy: {accuracy.toFixed(2)}%</span>
      <div className="Card">
        {quote && quote?.map((Word, i) => {
          return (
            <div className="Word" key={i * 10 + 5}>
              {
                Word.letters.map((Letter, i) => {
                  if (Letter.value === " ") {
                    return (
                      <span key={i * 10} style={Letter.style === styles.incorrect ? { ...Letter.style, textDecoration: "underline", marginTop: "33px" } : { ...Letter.style }}>&nbsp;</span>
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
      <input className="Input" style={{opacity: isChecked ? "1" : "0"}} ref={inputRef} onBlur={() => inputRef.current.focus()} type="text" spellcheck="false" autoFocus onKeyDown={(event) => handleKeyDown(event)} onChange={(event) => handleChange(event)}></input>
      <div style={{display: "flex", flexDirection: "row", position: "absolute", left: "3%", bottom: "5%"}}>
        <span style={{...styles.default, fontSize: "14px"}}>Toggle Input </span>
        <input className="showInput" ref={showInputRef} type="checkbox" defaultChecked={isChecked} onClick={() => {setIsChecked(old => !old)}} style={{color: "#4CBB17", width: "15px", height: "15px" }} />
      </div>
      <span style={{ opacity: "0" }}>{renderText}</span>
    </div>
  );
}

const textStyle = {
  fontSize: "25px",
  fontFamily: "Roboto Mono",
}
const styles = {
  default: { ...textStyle, color: "#99aab5"},
  correct: { ...textStyle, color: "#4CBB17"},
  incorrect: { ...textStyle, color: "#e62020"}
}
const ignoreKeys = [
  "Shift",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Alt",
  "Control",
]
export default App;
