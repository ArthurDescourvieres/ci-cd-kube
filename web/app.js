const form = document.querySelector('#note-form')
const list = document.querySelector('#notes')
const empty = document.querySelector('#empty')

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  const body = {
    title: form.title.value.trim(),
    content: form.content.value.trim(),
  }

  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.ok) {
    form.reset()
    form.title.focus()
    await load()
  }
})

async function remove(id) {
  await fetch(`/api/notes/${id}`, { method: 'DELETE' })
  await load()
}

function render(note) {
  const item = document.createElement('li')
  item.dataset.testid = 'note'

  const title = document.createElement('h2')
  title.textContent = note.title

  const content = document.createElement('p')
  content.textContent = note.content

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Supprimer'
  button.setAttribute('aria-label', `Supprimer ${note.title}`)
  button.addEventListener('click', () => remove(note.id))

  item.append(title, content, button)

  return item
}

async function load() {
  const response = await fetch('/api/notes')
  const notes = await response.json()

  empty.hidden = notes.length > 0
  list.replaceChildren(...notes.map(render))
}

load()
