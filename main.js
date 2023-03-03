// Selector
const playerText = document.querySelector("#player-display span")
const cells = document.querySelectorAll("#app table tr td")
const modeBtn = document.querySelector("#header button")
const modeText = document.querySelector("#mode")
const infoText = document.querySelector("#info-display p")


let canClick = true

const players = {
  circle: "circle",
  cross: "cross"
}

const playMode = {
  playWithFriend: "playWithFriend",
  playWithComputer: "playerWithComputer"
}

function row(num) {
  const n = 3 * (num - 1)
  return [n + 1, n + 2, n + 3]
}
function column(num) {
  return [num, num + 3, num + 6]
}

const checkingLines = [
  row(1),
  row(2),
  row(3),
  column(1),
  column(2),
  column(3),
  [1, 5, 9], // diagonal
  [3, 5, 7],
]

// 使用 map 來讓每個數字+1 變成 [1...9]
// 每個 position 都是 number
const allPositions = Array.from(Array(9).keys()).map(num => (num += 1));



const model = {
  currentPlayer: players.circle,
  currentPlayMode: playMode.playWithFriend,
  circlePosition: [],
  crossPosition: [],

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === players.circle ?
      players.cross : // 目前是 circle 換成 cross
      players.circle; // 目前是 cross 換成 circle
  },

  getCurrentPlayerPositions() {
    if (this.currentPlayer === players.circle) {
      return this.circlePosition
    } else {
      return this.crossPosition
    }
  },

  getUsedPosition() {
    const usedPositions = this.circlePosition.concat(this.crossPosition)
    return usedPositions
  },

  getEmptyPosition() {
    const usedPositions = this.getUsedPosition()
    const emptyPosition = allPositions.filter(position => !usedPositions.includes(position))
    return emptyPosition
  },

  isEmpty(position) {
    if (this.getEmptyPosition().includes(Number(position))) {
      return true
    }
    return false
  },

  recordPlayerPosition(index) {
    const indexNumber = Number(index) // 變成數字來記錄
    this.currentPlayer === players.circle ?
      this.circlePosition.push(indexNumber) :
      this.crossPosition.push(indexNumber)
  },

  togglePlayMode() {
    if (this.currentPlayMode === "playWithFriend") {
      this.currentPlayMode = playMode.playWithComputer
    } else {
      this.currentPlayMode = playMode.playWithFriend
    }
  },

  save() {
    const data = {
      gameMode: this.currentPlayMode
    }
    localStorage.setItem("ticTacToe", JSON.stringify(data))
  },

  load() {
    const data = JSON.parse(localStorage.getItem("ticTacToe"))
    this.currentPlayMode = data.gameMode
  },

}

const view = {
  draw(position, player) {
    const cell = document.querySelector(`#app table tr td[data-index='${position}']`)
    cell.innerHTML = `<div class="${player}"/>`
  },

  updateCurrentPlayer(player) {
    playerText.classList = []
    playerText.classList.add(player)
  },

  updateCurrentModeButton(mode) {
    if (mode === "playWithFriend") {
      modeText.textContent = "With Friend"
      modeBtn.classList = []
      modeBtn.classList.add("blue")
    } else {
      modeText.textContent = "With Computer"
      modeBtn.classList = []
      modeBtn.classList.add("red")
    }
  },
}


const control = {
  start() {
    model.load()
    view.updateCurrentModeButton(model.currentPlayMode)
  },


  onTableClick(event) {
    const target = event.target
    const position = target.dataset.index

    if (!canClick || !model.isEmpty(position)) return

    control.MakeAMove(position)

    setTimeout(() => {
      // 檢查遊戲結束
      if (control.checkGameOver()) return
      // 沒有結果就繼續
      model.switchPlayer()
      view.updateCurrentPlayer(model.currentPlayer)
      // 跟電腦玩？
      if (model.currentPlayMode === playMode.playWithComputer) {
        control.computerMove()
      }
    }
      , 100)
  },

  MakeAMove(position) {
    // 檢查空格
    if (!model.isEmpty(position)) return
    // 畫圖
    view.draw(position, model.currentPlayer)
    // 記錄位子
    model.recordPlayerPosition(position)
  },



  computerMove() {
    canClick = false

    // 下棋
    setTimeout(() => {
      const position = this.getBestPosition()
      control.MakeAMove(position)
    }, 500)

    setTimeout(() => {
      // 檢查遊戲結束
      if (control.checkGameOver()) return
      // 沒有結果就繼續
      model.switchPlayer()
      view.updateCurrentPlayer(model.currentPlayer)
      canClick = true
    }
      , 1000)

  },

  checkGameOver() {
    // 勝利
    if (this.isPlayerWin(model.getCurrentPlayerPositions())) {
      alert(`${model.currentPlayer} wins!`)
      window.location.reload()
      return true
    }
    // 平手
    if (model.getEmptyPosition().length === 0) {
      alert("Game is a Tie!")
      window.location.reload()
      return true
    }
  },

  isPlayerWin(playerPosition) {
    if (playerPosition.length === 0) return

    // 檢查勝利
    for (const line of checkingLines) {
      if (line.every(position => playerPosition.includes(position))) {
        return true
      }
    }
    return false
  },

  getBestPosition() {
    const emptyPositions = model.getEmptyPosition()
    let computerPositions = []
    let playerPosition = []

    // 取得位子
    if (model.currentPlayer === players.cross) {
      computerPositions = model.crossPosition
      playerPosition = model.circlePosition
    } else {
      computerPositions = model.circlePosition
      playerPosition = model.crossPosition
    }

    // 1. 找出電腦直接贏的位子
    for (const position of emptyPositions) {
      // 電腦下一步
      const computerNextMove = computerPositions.concat(position)
      // 檢查勝利可能
      if (control.isPlayerWin(computerNextMove)) {
        return position // 回傳勝利位子
      }
    }
    // 2. 找出玩家直接贏的位子
    const defendPositions = []
    for (const position of emptyPositions) {
      // 玩家下一步
      const playerNextMove = playerPosition.concat(position)
      // 檢查勝利可能
      if (control.isPlayerWin(playerNextMove)) {
        defendPositions.push(position)
      }
    }
    if (defendPositions.length !== 0) {
      return defendPositions[0]
    }

    // 3. 嘗試中間位子
    if (emptyPositions.includes(5)) {
      return 5
    }

    // 4. 都沒有就選隨機位子
    const randomIndex = Math.floor(Math.random() * emptyPositions.length)
    console.log(`use random position: ${emptyPositions[randomIndex]}`)
    return emptyPositions[randomIndex] // 回傳隨機位子
  },

  changeModeButtonClick() {
    if (model.togglePlayMode === "playWithFriends") {
      model.togglePlayMode(playMode.playWithComputer)
    } else {
      model.togglePlayMode(playMode.playWithFriend)
    }
    view.updateCurrentModeButton(model.currentPlayMode)
    model.save()
  },

}

// 監聽器
// 點擊table
cells.forEach(cell => cell.addEventListener("click", control.onTableClick))
modeBtn.addEventListener("click", control.changeModeButtonClick)

// Start
control.start()