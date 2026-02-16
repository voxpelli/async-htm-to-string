import { describe, it, expect } from 'tstyche';

import {
  html,
  h,
  render,
  renderToString,
  type ElementProps,
  type HtmlMethodResult,
  type RenderableElement,
  type RenderableElementFunction,
  type BasicRenderableElement,
} from '../index.js';

type ExtendableRenderableElementFunction<Props extends ElementProps = ElementProps> = (props: Props, children: RenderableElement[]) => HtmlMethodResult;

function requireHtmlMethodResult (_x: HtmlMethodResult): void {}

describe('HtmlMethodResult', () => {
  it('should reject invalid values', () => {
    const invalidValues = [123, null, undefined, false, true, () => {}, Symbol.asyncIterator];

    for (const item of invalidValues) {
      expect(requireHtmlMethodResult(item)).type.toRaiseError();
      expect(requireHtmlMethodResult([item])).type.toRaiseError();
    }
  });

  it('should accept valid values', () => {
    expect('foo').type.toBeAssignableTo<HtmlMethodResult>();
    expect({ type: 'div', props: {}, children: [] }).type.toBeAssignableTo<HtmlMethodResult>();
    expect('').type.toBeAssignableTo<HtmlMethodResult>();
    expect([{ type: 'div', props: {}, children: [] }, 'foo']).type.toBeAssignableTo<HtmlMethodResult>();
  });

  it('should infer type from html tag', () => {
    expect(html`<div />`).type.toBe<HtmlMethodResult>();
  });
});

describe('RenderableElementFunction', () => {
  it('should accept component functions', () => {
    const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
    const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

    expect(customPropsElem).type.toBeAssignableTo<RenderableElementFunction<any>>();
    expect(customPropsElem2).type.toBeAssignableTo<RenderableElementFunction<any>>();
  });

  it('should accept html with custom components', () => {
    const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
    const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

    expect(html`<wowzors class="wow"><${customPropsElem} foo=${123} /></wowzors>`).type.toBe<HtmlMethodResult>();
    expect(html`<wowzors class="wow"><${customPropsElem2} foo=${{ key: true }} /></wowzors>`).type.toBe<HtmlMethodResult>();
  });

  it('should reject invalid props for h()', () => {
    const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
    const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

    expect(h(customPropsElem, { yay: 123 })).type.toRaiseError();
    expect(h(customPropsElem2, { foo: 123 })).type.toRaiseError();
  });

  it('should infer h() return type', () => {
    const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
    const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

    expect(h(customPropsElem, { foo: 123 }, h(customPropsElem2, { foo: { key: true } }))).type.toBe<BasicRenderableElement<{ foo: number }>>();
  });
});

describe('complex element tree', () => {
  it('should be assignable to HtmlMethodResult', () => {
    const abc: RenderableElementFunction<{}> = (_props, children) => html`<cool>${children}</cool>`;
    const bar: RenderableElementFunction<{}> = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;

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
            },
          ],
        },
      ],
    };

    expect(complexElementTree).type.toBeAssignableTo<HtmlMethodResult>();
  });
});

describe('render', () => {
  it('should reject invalid arguments', () => {
    expect(render()).type.toRaiseError();
    expect(render(false)).type.toRaiseError();
  });

  it('should return AsyncIterableIterator for valid input', () => {
    expect(render('foo')).type.toBe<AsyncIterableIterator<string>>();
    expect(render({ type: 'div', props: {}, children: [] })).type.toBe<AsyncIterableIterator<string>>();
  });
});

describe('renderToString', () => {
  it('should return Promise<string>', () => {
    expect(renderToString('foo')).type.toBe<Promise<string>>();
    expect(renderToString({ type: 'div', props: {}, children: [] })).type.toBe<Promise<string>>();
  });
});
