import { addHtml } from './html';
import { addCss } from './css';
import { addJs } from './js';

export default function(Prism) {
  addHtml(Prism);
  addCss(Prism);
  addJs(Prism);
}
