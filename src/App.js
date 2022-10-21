//show best time, explore animations
import { useEffect, useRef, useState } from 'react';
import './App.css';

let quoteString = "";
let inputValue = "";
let mistakeCount;
let prevIncorrectChars;
let correctChars;
let incorrectChars;
//let currentIndex = 0; for single character update implementation
let timerStarted = false;
let currentTime;
let testResults = [];

function App() {
  const QUOTE_API = "https://quotable.io/random?minLength=150"; //find api with more quotes

  const [rerender, setRerender] = useState(false);
  const [quote, setQuote] = useState([])
  const [accuracy, setAccuracy] = useState(0)
  const [best, setBest] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [avgWpm, setAvgWpm] = useState(0)
  const inputRef = useRef(null)

  const [isFinished, setIsFinished] = useState(false)
  const [isInputChecked, setIsInputChecked] = useState(true)
  const [isCardChecked, setIsCardChecked] = useState(false)

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
    setRerender(old => !old)
    //eslint-disable-next-line
},[])

  const newQuote = async () => {
    let tempQuote = [];
    quoteString = await fetchQuote();
    quoteString = quoteString.replace("—", "-")
    // quoteString = "word"
    const wordArray = quoteString.split(" ")
    let wordLetters = []
    let wordIndex = 0;

    for (let i = 0; i < wordArray.length; i++) {
      //eslint-disable-next-line
      wordArray[i].split("").map(char => wordLetters.push(new Letter(char, styles.default)))
      wordLetters.push(new Letter(" ", styles.default))
      tempQuote.push(new Word(wordIndex, wordLetters))
      wordIndex += wordLetters.length
      wordLetters = []
    }
    tempQuote[tempQuote.length - 1].letters.splice(-1, 1)
    setQuote(tempQuote);
    // currentIndex = 0; for single character update implementation

    stopTimer()
    inputRef.current.value = ""
    currentTime = 0
    correctChars = 0
    mistakeCount = 0
    prevIncorrectChars = 0
    timerStarted = false
    setIsFinished(false)
    setRerender(old => !old)
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
    if (incorrectChars > prevIncorrectChars) {
      mistakeCount += incorrectChars - prevIncorrectChars;
    }
    prevIncorrectChars = incorrectChars
    setWpm(correctChars / 5 / currentTime * 60) //problem with state not changing, setting to NaN
    checkIsFinished()
    console.log(wpm)
    setRerender(old => !old)
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

  let finalWpm
  const checkIsFinished =  async () => {
    if (inputValue.length === quoteString.length && inputValue[quoteString.length - 1] === quoteString[quoteString.length - 1]) {
      finalWpm = correctChars / 5 / currentTime * 60
      stopTimer()
      testResults.push(finalWpm)
      let sum = 0
      testResults.forEach(wpm => sum += wpm)
      setAvgWpm(sum / testResults.length)
      finalWpm > best && setBest(finalWpm)
      setIsFinished(true)
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
      newQuote()
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
        <div className="StatsContainer">
          <div style={{display: "flex", flexDirection: "column"}}>
            <span>Best: {best.toFixed(2)}</span>
            <span>Avg: {avgWpm.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <span style={{ ...styles.default, fontSize: "22px", marginTop: "-2%", marginBottom: "2%" }}>Wpm: {wpm.toFixed(2)} Accuracy: {accuracy.toFixed(2)}%</span>

      <div className="Card" style={{ boxShadow: isCardChecked && "0px 0px 15px black", backgroundColor: isCardChecked && "#282b30" }}>
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

      <input className="Input" style={{ opacity: isInputChecked ? "1" : "0" }} ref={inputRef} onBlur={() => inputRef.current.focus()} type="text" spellCheck="false" autoFocus onKeyDown={(event) => handleKeyDown(event)} onChange={(event) => handleChange(event)}></input>
      <span style={{ ...styles.default, fontSize: "22px", marginTop: "1%", opacity: isFinished ? ".5" : "0" }} >Press Enter to Continue...</span>

      <div className="Settings">
        <div className='ToggleContainer'>
          <span style={{ ...styles.default, fontSize: "14px" }}>Toggle Card&nbsp;&nbsp;</span>
          <input className="Checkbox" type="checkbox" defaultChecked={isCardChecked} onClick={() => { setIsCardChecked(old => !old) }} />

        </div>
        <div className="ToggleContainer">
          <span style={{ ...styles.default, fontSize: "14px" }}>Toggle Input&nbsp;</span>
          <input className="Checkbox" type="checkbox" defaultChecked={isInputChecked} onClick={() => { setIsInputChecked(old => !old) }} />
        </div>
      </div>

        <span style={{opacity: "0"}}>{rerender}</span>
    </div>
  );
}

const textStyle = {
  fontSize: "25px",
  fontFamily: "Roboto Mono",
}
const styles = {
  default: { ...textStyle, color: "#99aab5" },
  correct: { ...textStyle, color: "#4CBB17" },
  incorrect: { ...textStyle, color: "#e62020" }
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
