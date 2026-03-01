import { describe, expect, test } from 'tstyche';

import {
  html,
  h,
  rawHtml,
  render,
  renderSync,
  renderToString,
  renderToStringSync,
  generatorToString,
} from 'async-htm-to-string';

import type {
  ElementProps,
  ElementPropsValue,
  HtmlMethodResult,
  HtmlTemplateValue,
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

  test('should not accept no arguments or invalid types', () => {
    expect(renderToStringSync()).type.toRaiseError();
    expect(renderToStringSync(false)).type.toRaiseError();
  });
});

describe('renderSync()', () => {
  test('should return string', () => {
    expect(renderSync({ type: 'div', props: {}, children: [] })).type.toBe<string>();
  });

  test('should not accept no arguments or invalid types', () => {
    expect(renderSync()).type.toRaiseError();
    expect(renderSync(false)).type.toRaiseError();
  });
});

describe('rawHtml', () => {
  test('should return BasicRenderableElement from template tag', () => {
    expect(rawHtml`<div>raw</div>`).type.toBe<BasicRenderableElement<{}>>();
  });

  test('should return BasicRenderableElement from string call', () => {
    expect(rawHtml('<div>raw</div>')).type.toBe<BasicRenderableElement<{}>>();
  });

  test('should be assignable to HtmlMethodResult', () => {
    expect<HtmlMethodResult>().type.toBeAssignableFrom(rawHtml`<div>raw</div>`);
    expect<HtmlMethodResult>().type.toBeAssignableFrom(rawHtml('<div>raw</div>'));
  });
});

describe('h()', () => {
  test('should accept string type', () => {
    expect(h('div', {})).type.toBe<BasicRenderableElement<{}>>();
    expect(h('div', {}, 'child')).type.toBe<BasicRenderableElement<{}>>();
  });
});

describe('HtmlTemplateValue assignability', () => {
  test('should accept HtmlMethodResult', () => {
    // THE REGRESSION TEST — nesting html`` inside html`` is the core use case
    const result: HtmlMethodResult = html`<span>child</span>`;
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(result);
  });

  test('should accept Promise<HtmlMethodResult>', () => {
    const p: Promise<HtmlMethodResult> = Promise.resolve(html`<span />`);
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(p);
  });

  test('should accept Promise<string>', () => {
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(Promise.resolve('foo'));
  });

  test('should accept Promise<BasicRenderableElement>', () => {
    const p: Promise<BasicRenderableElement<{}>> = Promise.resolve({ type: 'div' as const, props: {}, children: [] });
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(p);
  });

  test('should not accept Promise<number>', () => {
    expect<HtmlTemplateValue>().type.not.toBeAssignableFrom(Promise.resolve(42) as Promise<number>);
  });

  test('should not accept Promise<boolean>', () => {
    expect<HtmlTemplateValue>().type.not.toBeAssignableFrom(Promise.resolve(true) as Promise<boolean>);
  });

  test('should not accept Promise<symbol>', () => {
    expect<HtmlTemplateValue>().type.not.toBeAssignableFrom(Promise.resolve(Symbol('x')) as Promise<symbol>);
  });

  test('should accept null for conditional rendering pattern', () => {
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(null);
  });

  test('should accept false for conditional rendering pattern (&&)', () => {
    expect<HtmlTemplateValue>().type.toBeAssignableFrom(false as const);
  });

  test('should not accept symbol', () => {
    expect<HtmlTemplateValue>().type.not.toBeAssignableFrom(Symbol('x'));
  });
});

describe('html template composition', () => {
  test('should accept nested html`` result as interpolation', () => {
    // Reproduction from consumer report — this is the fundamental composition pattern
    const badge: HtmlMethodResult = html`<span class="badge">new</span>`;
    expect(html`<div>${badge}</div>`).type.toBe<HtmlMethodResult>();
  });

  test('should accept Promise<HtmlMethodResult> as interpolation', () => {
    const asyncContent: Promise<HtmlMethodResult> = Promise.resolve(html`<span>async</span>`);
    expect(html`<div>${asyncContent}</div>`).type.toBe<HtmlMethodResult>();
  });

  test('should accept rawHtml result as interpolation', () => {
    expect(html`<div>${rawHtml`<b>raw</b>`}</div>`).type.toBe<HtmlMethodResult>();
  });

  test('should accept component function result as interpolation', () => {
    const component: RenderableElementFunction<{}> = (_props, children) => html`<span>${children}</span>`;
    const result: HtmlMethodResult = html`<${component}>child<//>`;
    expect(html`<div>${result}</div>`).type.toBe<HtmlMethodResult>();
  });

  test('should accept null for conditional rendering', () => {
    const show = true;
    const content: HtmlMethodResult = html`<span>visible</span>`;
    expect(html`<div>${show ? content : null}</div>`).type.toBe<HtmlMethodResult>();
  });

  test('should accept false for conditional rendering (&&)', () => {
    const show = false;
    const content: HtmlMethodResult = html`<span>visible</span>`;
    expect(html`<div>${show && content}</div>`).type.toBe<HtmlMethodResult>();
  });
});

describe('ElementPropsValue — Set and Map covariance', () => {
  test('Set<string> is assignable', () => {
    expect<ElementPropsValue>().type.toBeAssignableFrom(new Set<string>());
  });
  test('Set<number> is assignable', () => {
    expect<ElementPropsValue>().type.toBeAssignableFrom(new Set<number>());
  });
  test('Map<string, string> is assignable', () => {
    expect<ElementPropsValue>().type.toBeAssignableFrom(new Map<string, string>());
  });
  test('Map<string, number> is assignable', () => {
    expect<ElementPropsValue>().type.toBeAssignableFrom(new Map<string, number>());
  });
  test('ElementProps accepts Set<string> prop value', () => {
    expect<ElementProps>().type.toBeAssignableFrom({ classes: new Set<string>() });
  });
  test('ElementProps accepts Map<string, string> prop value', () => {
    expect<ElementProps>().type.toBeAssignableFrom({ data: new Map<string, string>() });
  });
});

describe('generatorToString()', () => {
  test('should return Promise<string>', () => {
    async function * gen (): AsyncIterableIterator<string> { yield 'a'; }
    expect(generatorToString(gen())).type.toBe<Promise<string>>();
  });

  test('should accept sync iterables too', () => {
    function * gen (): IterableIterator<string> { yield 'a'; }
    expect(generatorToString(gen())).type.toBe<Promise<string>>();
  });
});
