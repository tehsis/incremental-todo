import {ul, button, a, i, li, h4, form, input, div} from 'charata';

/**
 * Represents a new todo-list
 */
export default class TodoList {
  constructor(list=[]) {
    this.list = {};
    list.forEach((el) => {
      this.addItem(el);
    });
  }

  /**
   * Adds a new item to the list
   *
   * @param {string} text todo-item's text
   */
  addItem(text) {
    var idx = Date.now();
    this.list[idx] = text;
    this.render();
  }

  /**
   * Removes an item from the list.
   *
   * @param {string} idx id of the element to remove
   */
  removeItem(idx) {
    delete this.list[idx];
    this.render();
  }

  /**
   * Attach the events needed by the component
   *
   * @private
   */
  _attachEvents() {
    let done_anchors = this.container.getElementsByTagName('a');
    Array.prototype.forEach.call(done_anchors, (anchor) => {
      anchor.addEventListener('click', (ev) => {
        ev.preventDefault();
        let idx = anchor.parentElement.parentElement.dataset.idx;
        this.removeItem(idx);
      });
    });
  }

  /**
   * Creates an array with each individual item Element.
   *
   * @private
   */
  _renderItems() {
    return Object.keys(this.list).map((idx) => {
      return li(
        div([
          this.list[idx],
          a(i('send', null, ['class', 'material-icons']), null, ['class', 'secondary-content', 'href', '#!'])
        ]), idx, ['data-idx', idx, 'class', 'collection-item']);
    });
  }

  /**
   * Renders the todo-list's component into a specified container.
   *
   * @param {HTMLElement} container the container where the todo-list is going to be rendered.
   */
  render(container) {
    this.container = container || this.container || document.body;
    let items = this._renderItems();
    if (items.length) {
      ul(items, null, ['class', 'collection']).renderTo(this.container);
    } else {
      div('Hooray! you are free!', null, ['class', 'center']).renderTo(this.container);
    }
    this._attachEvents();
  }
}
