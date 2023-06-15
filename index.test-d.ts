import {
  expectAssignable,
  expectNotAssignable,
  expectError,
  expectType
} from 'tsd';
import {
  html,
  h,
  render,
  renderToString,
  ElementProps,
  HtmlMethodResult,
  RenderableElement,
  RenderableElementFunction,
  BasicRenderableElement
} from '.';

type ExtendableRenderableElementFunction<Props extends ElementProps = ElementProps> = (props: Props, children: RenderableElement[]) => HtmlMethodResult;

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

expectType<HtmlMethodResult>(html`<div />`);

const abc: RenderableElementFunction<{}> = (_props, children) => html`<cool>${children}</cool>`;
const bar: RenderableElementFunction<{}> = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;

const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

expectAssignable<RenderableElementFunction<any>>(customPropsElem);
expectAssignable<RenderableElementFunction<any>>(customPropsElem2);

// TODO: Eventually make this be an error
// expectError(html`<wowzors class="wow"><${customPropsElem} />Foo</wowzors>`);
expectType<HtmlMethodResult>(html`<wowzors class="wow"><${customPropsElem} foo=${123} /></wowzors>`);
expectType<HtmlMethodResult>(html`<wowzors class="wow"><${customPropsElem2} foo=${{ key: true }} /></wowzors>`);

expectError(h(abc, { foo: null }))
expectError(h(customPropsElem, { yay: 123 }));
expectError(h(customPropsElem2, { foo: 123 }));

expectType<BasicRenderableElement<{ foo: number }>>(h(
  customPropsElem,
  { foo: 123 },
  h(customPropsElem2, { foo: { key: true } })
));

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
