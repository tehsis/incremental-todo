import ID from 'incremental-dom';

export let render = (el, container) => {
  ID.patch(container, el.render.bind(el));
}

/**
 * Represents a HTML Element
 */
export class EL {
  /**
   * Creates a new element
   *
   * @abstract
   * @param {string} tag the specific HTML TAG of the Element.
   * @param {null|String|EL|Array} content
   * @param {Array} props
   */
  constructor(tag, content=null, key='', props=[]) {
    this.tag = tag;
    this.content = content;
    this.key = key;
    this.props = props;
  }

  /**
   * Renders this Element.
   *
   *
   */
  render() {
    if (null === this.content) {
      ID.elementVoid(this.tag, this.key, this.props);
      return;
    }

    ID.elementOpen(this.tag, this.key, this.props);

    if ('string' === typeof this.content) {
      ID.text(this.content);
    } else if (Array.isArray(this.content)) {
      this.content.forEach((c) => {
        if ('string' === typeof c) {
          ID.text(c);
          return;
        }

        c.render();
      });
    } else {
      this.content.render();
    }

    ID.elementClose(this.tag);
  }
}

export class LI extends EL {
  constructor(content, key, props) {
    super('li', content, key, props);
  }
}

export class UL extends EL {
  constructor(elms=[], key, props) {
    super('ul', elms, key, props);
  }
}

export class FORM extends EL {
  constructor(elms, key, props) {
    super('form', elms, key, props);
  }
}

export class INPUT extends EL {
  constructor(key, props) {
    super('input', null, key, props);
  }
}

export class BUTTON extends EL {
  constructor(elms, key, props) {
    super('button', elms, key, props);
  }
}

export class H1 extends EL {
  constructor(elms, key, props) {
    super('H1', elms, key, props);
  }
}

export class H4 extends EL {
  constructor(elms, key, props) {
    super('H4', elms, key, props);
  }
}

export class A extends EL {
  constructor(elms, key, props) {
    super('A', elms, key, props);
  }
}

export class I extends EL {
  constructor(elms, key, props) {
    super('I', elms, key, props);
  }
}

export class DIV extends EL {
  constructor(elms, key, props) {
    super('DIV', elms, key, props);
  }
}
