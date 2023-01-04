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

/////////////
// Drawing //
/////////////

fetchMemoriesData().then(async (memoriesData) => {
  const first10 = memoriesData.slice(0, 10) // for testing

  const images = memoriesData
  // const images = first10

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

  // Draw images
  let frame = 0
  let imageIndex = 0
  const FRAMES_PER_IMAGE = 6 // calcaulate frames per image based on fps. We want 6 images per second for example.
  function draw() {
    //////////
    // DRAW //
    //////////

    ctx.drawImage(
      secondaryImages[imageIndex],
      0,
      0,
      canvas.width,
      canvas.height,
    )
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

    //////////////////////////
    // SETUP FOR NEXT FRAME //
    //////////////////////////

    frame++
    // Set image index based on frame
    if (frame % FRAMES_PER_IMAGE === 0) {
      imageIndex++
    }

    // Loop the images
    if (imageIndex === primaryImages.length) {
      imageIndex = 0
    }

    requestAnimationFrame(draw)
  }
  draw()
})
