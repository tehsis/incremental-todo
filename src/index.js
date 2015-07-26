import TodoList from './todo-list';

let formContainer = document.getElementById('todo-form');
let todoContainer = document.getElementById('todo');

let myList = new TodoList();

myList.render(todoContainer);

let form = document.getElementById('add-todo');

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  let input = form.elements.namedItem('new-item');
  myList.addItem(input.value);
  input.value = '';
});
