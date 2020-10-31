import {
  expectAssignable,
  expectNotAssignable,
  expectError,
  expectType
} from 'tsd';
import {
  html,
  render,
  renderToString,
  HtmlMethodResult,
  RenderableElementFunction
} from '.';

const invalidValues = [
  123,
  null,
  undefined,
  false,
  true,
  () => {},
  Symbol.asyncIterator,
];

for (const item of invalidValues) {
  expectNotAssignable<HtmlMethodResult>(item);
  expectNotAssignable<HtmlMethodResult>([item]);
}

expectAssignable<HtmlMethodResult>('foo');
expectAssignable<HtmlMethodResult>({ type: 'div', props: {}, children: [] });
expectAssignable<HtmlMethodResult>('');
expectAssignable<HtmlMethodResult>([ { type: 'div', props: {}, children: [] }, 'foo' ]);

expectError(html`${null}`);

expectType<HtmlMethodResult>(html`<div />`);

const abc: RenderableElementFunction = (_props, children) => html`<cool>${children}</cool>`;
const bar: RenderableElementFunction = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;

const complexElementTree: HtmlMethodResult = {
  type: 'div',
  props: { 'class': 'prop1 prop2', 'data-foo': '123' },
  children: [
    '  ',
    { type: 'img', props: { src: '#' }, children: [] },
    ' ',
    {
      type: bar,
      props: {},
      children: [
        '    ',
        {
          type: 'woot',
          props: {},
          children: ['YEA&H!', '<div>w0000000000t</div>'],
        }
      ]
    }
  ]
};

expectAssignable<HtmlMethodResult>(complexElementTree);

expectError(render());
expectError(render(false));

expectType<AsyncIterableIterator<string>>(render('foo'));
expectType<AsyncIterableIterator<string>>(render(complexElementTree));

expectType<Promise<string>>(renderToString('foo'));
expectType<Promise<string>>(renderToString(complexElementTree));
