import { describe, expect, test } from 'tstyche';

import {
  html,
  h,
  render,
  renderSync,
  renderToString,
  renderToStringSync,
} from 'async-htm-to-string';

import type {
  ElementProps,
  HtmlMethodResult,
  RenderableElement,
  RenderableElementFunction,
  BasicRenderableElement,
} from 'async-htm-to-string';

type ExtendableRenderableElementFunction<Props extends ElementProps = ElementProps> = (props: Props, children: RenderableElement[]) => HtmlMethodResult;

describe('HtmlMethodResult assignability', () => {
  test('should not accept invalid values', () => {
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(123);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(null);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(undefined);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(false);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(true);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(() => {});
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom(Symbol.asyncIterator);

    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([123]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([null]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([undefined]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([false]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([true]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([() => {}]);
    expect<HtmlMethodResult>().type.not.toBeAssignableFrom([Symbol.asyncIterator]);
  });

  test('should accept valid values', () => {
    expect<HtmlMethodResult>().type.toBeAssignableFrom('foo' as const);
    expect<HtmlMethodResult>().type.toBeAssignableFrom({ type: 'div' as const, props: {}, children: [] });
    expect<HtmlMethodResult>().type.toBeAssignableFrom('' as const);
    expect<HtmlMethodResult>().type.toBeAssignableFrom([{ type: 'div' as const, props: {}, children: [] }, 'foo']);
  });

  test('html template returns HtmlMethodResult', () => {
    expect(html`<div />`).type.toBe<HtmlMethodResult>();
  });
});

describe('RenderableElementFunction', () => {
  const abc: RenderableElementFunction<{}> = (_props, children) => html`<cool>${children}</cool>`;
  const bar: RenderableElementFunction<{}> = (_props, children) => html`<wowzors class="wow"><${abc}>${children}<//></wowzors>`;

  const customPropsElem: ExtendableRenderableElementFunction<{ foo: number }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;
  const customPropsElem2: ExtendableRenderableElementFunction<{ foo: Record<string, boolean> }> = ({ foo }, children) => html`<cool bar=${foo}>${children}</cool>`;

  test('custom props are assignable to RenderableElementFunction<any>', () => {
    expect(customPropsElem).type.toBeAssignableTo<RenderableElementFunction<any>>();
    expect(customPropsElem2).type.toBeAssignableTo<RenderableElementFunction<any>>();
  });

  test('html templates with custom props return HtmlMethodResult', () => {
    expect(html`<wowzors class="wow"><${customPropsElem} foo=${123} /></wowzors>`).type.toBe<HtmlMethodResult>();
    expect(html`<wowzors class="wow"><${customPropsElem2} foo=${{ key: true }} /></wowzors>`).type.toBe<HtmlMethodResult>();
  });

  test('h() with wrong props should raise error', () => {
    expect(h(customPropsElem, { yay: 123 })).type.toRaiseError();
    expect(h(customPropsElem2, { foo: 123 })).type.toRaiseError();
  });

  test('h() returns BasicRenderableElement with correct props', () => {
    expect(h(
      customPropsElem,
      { foo: 123 },
      h(customPropsElem2, { foo: { key: true } })
    )).type.toBe<BasicRenderableElement<{ foo: number }>>();
  });

  test('complex element tree is assignable to HtmlMethodResult', () => {
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

describe('render()', () => {
  test('should not accept no arguments or false', () => {
    expect(render()).type.toRaiseError();
    expect(render(false)).type.toRaiseError();
  });

  test('should return AsyncIterableIterator<string>', () => {
    expect(render('foo')).type.toBe<AsyncIterableIterator<string>>();
    expect(render({ type: 'div', props: {}, children: [] })).type.toBe<AsyncIterableIterator<string>>();
  });
});

describe('renderSync()', () => {
  test('should return string', () => {
    expect(renderSync({ type: 'div', props: {}, children: [] })).type.toBe<string>();
  });
});

describe('renderToString()', () => {
  test('should return Promise<string>', () => {
    expect(renderToString('foo')).type.toBe<Promise<string>>();
    expect(renderToString({ type: 'div', props: {}, children: [] })).type.toBe<Promise<string>>();
  });
});

describe('renderToStringSync()', () => {
  test('should return string', () => {
    expect(renderToStringSync({ type: 'div', props: {}, children: [] })).type.toBe<string>();
  });
});
