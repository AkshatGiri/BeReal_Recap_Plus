function createSignal(intialValue) {
  let callbacks = []
  let value = intialValue

  function set(newValue) {
    value = newValue
    callbacks.forEach((callback) => callback(value))
  }

  function get() {
    return value
  }

  function subscribe(callback) {
    callbacks.push(callback)
    return function unsubscribe() {
      callbacks = callbacks.filter((cb) => cb !== callback)
    }
  }

  return [get, set, subscribe]
}

///////////////////////
// Setting up Canvas //
///////////////////////
let canvas = document.getElementById('video-canvas')
canvas.width = 1500 * 0.3
canvas.height = 2000 * 0.3

let ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = true
ctx.imageSmoothingQuality = 'high'

////////////////
// Fetch Data //
////////////////
async function fetchMemoriesData() {
  const response = await fetch('./data.json')
  const data = await response.json()
  return data
}

//////////////////
// Draw Helpers //
//////////////////
function roundedImage(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  )
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

///////////
// Draw ///
///////////
function draw({ frame, secondaryImages, primaryImages }) {
  const FRAMES_PER_IMAGE = 6 // calcaulate frames per image based on fps. We want 6 images per second for example.
  const imageIndex = Math.floor(frame / FRAMES_PER_IMAGE) % primaryImages.length // eg 20 / 6 = 3.33, Math.floor(3.33) = 3, 3 % 10 = 3

  ctx.drawImage(secondaryImages[imageIndex], 0, 0, canvas.width, canvas.height)
  ctx.save()
  roundedImage(ctx, 16, 16, canvas.width / 3, canvas.height / 3, 10)

  // ctx.beginPath()
  ctx.strokeStyle = '#000' // some color/style
  ctx.lineWidth = 8 // thickness
  ctx.stroke()
  ctx.clip()
  ctx.drawImage(
    primaryImages[imageIndex],
    16,
    16,
    canvas.width / 3,
    canvas.height / 3,
  )
  ctx.restore()
}

async function main() {
  const memoriesData = await fetchMemoriesData()

  const first10 = memoriesData.slice(0, 10)

  // const images = memoriesData
  const images = first10

  // Load images in memory
  primaryImages = images.map((memory) => {
    const img = new Image()
    img.src = memory.primary_photo
    return img
  })

  secondaryImages = images.map((memory) => {
    const img = new Image()
    img.src = memory.secondary_photo
    return img
  })

  // Wait for images to be loaded
  await Promise.all([
    ...primaryImages.map(
      (img) =>
        new Promise((resolve) => {
          img.onload = resolve
        }),
    ),
    ...secondaryImages.map(
      (img) =>
        new Promise((resolve) => {
          img.onload = resolve
        }),
    ),
  ])

  const [getFrame, setFrame, onFrameChange] = createSignal(0)
  const PlayStates = {
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
  }
  const [getPlayState, setPlayState, onPlayState] = createSignal(
    PlayStates.PLAYING,
  )

  onFrameChange((f) => {
    frameInput.value = f
  })

  const frameInput = document.getElementById('frame-input')
  frameInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value)
    if (value < 0 || Number.isNaN(value)) return
    setFrame(parseInt(e.target.value))
  })

  function togglePlay() {
    if (getPlayState() === PlayStates.PLAYING) {
      setPlayState(PlayStates.PAUSED)
    } else {
      setPlayState(PlayStates.PLAYING)
    }
  }

  document.onkeyup = function (e) {
    if (e.key == ' ' || e.code == 'Space') {
      togglePlay()
    }
  }

  const playButton = document.getElementById('play-button')
  playButton.addEventListener('click', () => {
    togglePlay()
  })

  onPlayState((state) => {
    if (state === PlayStates.PLAYING) {
      playButton.innerHTML = 'Pause'
    } else {
      playButton.innerHTML = 'Play'
    }
  })

  function step(timestamp) {
    draw({ frame: getFrame(), primaryImages, secondaryImages })
    // add play or pause
    if (getPlayState() === PlayStates.PLAYING) {
      setFrame(getFrame() + 1)
    }
    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

// Start the application
main()
