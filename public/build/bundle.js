
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
	'use strict';

	const environment = {
		apiURL : "https://sos-mobile-api-one.vercel.app"
	};

	function noop() { }
	function assign(tar, src) {
	    // @ts-ignore
	    for (const k in src)
	        tar[k] = src[k];
	    return tar;
	}
	function add_location(element, file, line, column, char) {
	    element.__svelte_meta = {
	        loc: { file, line, column, char }
	    };
	}
	function run(fn) {
	    return fn();
	}
	function blank_object() {
	    return Object.create(null);
	}
	function run_all(fns) {
	    fns.forEach(run);
	}
	function is_function(thing) {
	    return typeof thing === 'function';
	}
	function safe_not_equal(a, b) {
	    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}
	function is_empty(obj) {
	    return Object.keys(obj).length === 0;
	}
	function validate_store(store, name) {
	    if (store != null && typeof store.subscribe !== 'function') {
	        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
	    }
	}
	function subscribe(store, ...callbacks) {
	    if (store == null) {
	        return noop;
	    }
	    const unsub = store.subscribe(...callbacks);
	    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}
	function component_subscribe(component, store, callback) {
	    component.$$.on_destroy.push(subscribe(store, callback));
	}
	function create_slot(definition, ctx, $$scope, fn) {
	    if (definition) {
	        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
	        return definition[0](slot_ctx);
	    }
	}
	function get_slot_context(definition, ctx, $$scope, fn) {
	    return definition[1] && fn
	        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
	        : $$scope.ctx;
	}
	function get_slot_changes(definition, $$scope, dirty, fn) {
	    if (definition[2] && fn) {
	        const lets = definition[2](fn(dirty));
	        if ($$scope.dirty === undefined) {
	            return lets;
	        }
	        if (typeof lets === 'object') {
	            const merged = [];
	            const len = Math.max($$scope.dirty.length, lets.length);
	            for (let i = 0; i < len; i += 1) {
	                merged[i] = $$scope.dirty[i] | lets[i];
	            }
	            return merged;
	        }
	        return $$scope.dirty | lets;
	    }
	    return $$scope.dirty;
	}
	function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
	    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
	    if (slot_changes) {
	        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
	        slot.p(slot_context, slot_changes);
	    }
	}

	function append(target, node) {
	    target.appendChild(node);
	}
	function insert(target, node, anchor) {
	    target.insertBefore(node, anchor || null);
	}
	function detach(node) {
	    node.parentNode.removeChild(node);
	}
	function element(name) {
	    return document.createElement(name);
	}
	function text(data) {
	    return document.createTextNode(data);
	}
	function space() {
	    return text(' ');
	}
	function empty() {
	    return text('');
	}
	function listen(node, event, handler, options) {
	    node.addEventListener(event, handler, options);
	    return () => node.removeEventListener(event, handler, options);
	}
	function attr(node, attribute, value) {
	    if (value == null)
	        node.removeAttribute(attribute);
	    else if (node.getAttribute(attribute) !== value)
	        node.setAttribute(attribute, value);
	}
	function set_custom_element_data(node, prop, value) {
	    if (prop in node) {
	        node[prop] = value;
	    }
	    else {
	        attr(node, prop, value);
	    }
	}
	function children(element) {
	    return Array.from(element.childNodes);
	}
	function set_style(node, key, value, important) {
	    node.style.setProperty(key, value, important ? 'important' : '');
	}
	function custom_event(type, detail) {
	    const e = document.createEvent('CustomEvent');
	    e.initCustomEvent(type, false, false, detail);
	    return e;
	}

	let current_component;
	function set_current_component(component) {
	    current_component = component;
	}
	function get_current_component() {
	    if (!current_component)
	        throw new Error(`Function called outside component initialization`);
	    return current_component;
	}
	function createEventDispatcher() {
	    const component = get_current_component();
	    return (type, detail) => {
	        const callbacks = component.$$.callbacks[type];
	        if (callbacks) {
	            // TODO are there situations where events could be dispatched
	            // in a server (non-DOM) environment?
	            const event = custom_event(type, detail);
	            callbacks.slice().forEach(fn => {
	                fn.call(component, event);
	            });
	        }
	    };
	}
	function setContext(key, context) {
	    get_current_component().$$.context.set(key, context);
	}
	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	function bubble(component, event) {
	    const callbacks = component.$$.callbacks[event.type];
	    if (callbacks) {
	        callbacks.slice().forEach(fn => fn(event));
	    }
	}

	const dirty_components = [];
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];
	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	function schedule_update() {
	    if (!update_scheduled) {
	        update_scheduled = true;
	        resolved_promise.then(flush);
	    }
	}
	function tick() {
	    schedule_update();
	    return resolved_promise;
	}
	function add_render_callback(fn) {
	    render_callbacks.push(fn);
	}
	let flushing = false;
	const seen_callbacks = new Set();
	function flush() {
	    if (flushing)
	        return;
	    flushing = true;
	    do {
	        // first, call beforeUpdate functions
	        // and update components
	        for (let i = 0; i < dirty_components.length; i += 1) {
	            const component = dirty_components[i];
	            set_current_component(component);
	            update(component.$$);
	        }
	        dirty_components.length = 0;
	        while (binding_callbacks.length)
	            binding_callbacks.pop()();
	        // then, once components are updated, call
	        // afterUpdate functions. This may cause
	        // subsequent updates...
	        for (let i = 0; i < render_callbacks.length; i += 1) {
	            const callback = render_callbacks[i];
	            if (!seen_callbacks.has(callback)) {
	                // ...so guard against infinite loops
	                seen_callbacks.add(callback);
	                callback();
	            }
	        }
	        render_callbacks.length = 0;
	    } while (dirty_components.length);
	    while (flush_callbacks.length) {
	        flush_callbacks.pop()();
	    }
	    update_scheduled = false;
	    flushing = false;
	    seen_callbacks.clear();
	}
	function update($$) {
	    if ($$.fragment !== null) {
	        $$.update();
	        run_all($$.before_update);
	        const dirty = $$.dirty;
	        $$.dirty = [-1];
	        $$.fragment && $$.fragment.p($$.ctx, dirty);
	        $$.after_update.forEach(add_render_callback);
	    }
	}
	const outroing = new Set();
	let outros;
	function group_outros() {
	    outros = {
	        r: 0,
	        c: [],
	        p: outros // parent group
	    };
	}
	function check_outros() {
	    if (!outros.r) {
	        run_all(outros.c);
	    }
	    outros = outros.p;
	}
	function transition_in(block, local) {
	    if (block && block.i) {
	        outroing.delete(block);
	        block.i(local);
	    }
	}
	function transition_out(block, local, detach, callback) {
	    if (block && block.o) {
	        if (outroing.has(block))
	            return;
	        outroing.add(block);
	        outros.c.push(() => {
	            outroing.delete(block);
	            if (callback) {
	                if (detach)
	                    block.d(1);
	                callback();
	            }
	        });
	        block.o(local);
	    }
	}

	const globals = (typeof window !== 'undefined'
	    ? window
	    : typeof globalThis !== 'undefined'
	        ? globalThis
	        : global);
	function create_component(block) {
	    block && block.c();
	}
	function mount_component(component, target, anchor) {
	    const { fragment, on_mount, on_destroy, after_update } = component.$$;
	    fragment && fragment.m(target, anchor);
	    // onMount happens before the initial afterUpdate
	    add_render_callback(() => {
	        const new_on_destroy = on_mount.map(run).filter(is_function);
	        if (on_destroy) {
	            on_destroy.push(...new_on_destroy);
	        }
	        else {
	            // Edge case - component was destroyed immediately,
	            // most likely as a result of a binding initialising
	            run_all(new_on_destroy);
	        }
	        component.$$.on_mount = [];
	    });
	    after_update.forEach(add_render_callback);
	}
	function destroy_component(component, detaching) {
	    const $$ = component.$$;
	    if ($$.fragment !== null) {
	        run_all($$.on_destroy);
	        $$.fragment && $$.fragment.d(detaching);
	        // TODO null out other refs, including component.$$ (but need to
	        // preserve final state?)
	        $$.on_destroy = $$.fragment = null;
	        $$.ctx = [];
	    }
	}
	function make_dirty(component, i) {
	    if (component.$$.dirty[0] === -1) {
	        dirty_components.push(component);
	        schedule_update();
	        component.$$.dirty.fill(0);
	    }
	    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
	}
	function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
	    const parent_component = current_component;
	    set_current_component(component);
	    const prop_values = options.props || {};
	    const $$ = component.$$ = {
	        fragment: null,
	        ctx: null,
	        // state
	        props,
	        update: noop,
	        not_equal,
	        bound: blank_object(),
	        // lifecycle
	        on_mount: [],
	        on_destroy: [],
	        before_update: [],
	        after_update: [],
	        context: new Map(parent_component ? parent_component.$$.context : []),
	        // everything else
	        callbacks: blank_object(),
	        dirty,
	        skip_bound: false
	    };
	    let ready = false;
	    $$.ctx = instance
	        ? instance(component, prop_values, (i, ret, ...rest) => {
	            const value = rest.length ? rest[0] : ret;
	            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
	                if (!$$.skip_bound && $$.bound[i])
	                    $$.bound[i](value);
	                if (ready)
	                    make_dirty(component, i);
	            }
	            return ret;
	        })
	        : [];
	    $$.update();
	    ready = true;
	    run_all($$.before_update);
	    // `false` as a special case of no DOM component
	    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	    if (options.target) {
	        if (options.hydrate) {
	            const nodes = children(options.target);
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            $$.fragment && $$.fragment.l(nodes);
	            nodes.forEach(detach);
	        }
	        else {
	            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	            $$.fragment && $$.fragment.c();
	        }
	        if (options.intro)
	            transition_in(component.$$.fragment);
	        mount_component(component, options.target, options.anchor);
	        flush();
	    }
	    set_current_component(parent_component);
	}
	class SvelteComponent {
	    $destroy() {
	        destroy_component(this, 1);
	        this.$destroy = noop;
	    }
	    $on(type, callback) {
	        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
	        callbacks.push(callback);
	        return () => {
	            const index = callbacks.indexOf(callback);
	            if (index !== -1)
	                callbacks.splice(index, 1);
	        };
	    }
	    $set($$props) {
	        if (this.$$set && !is_empty($$props)) {
	            this.$$.skip_bound = true;
	            this.$$set($$props);
	            this.$$.skip_bound = false;
	        }
	    }
	}

	function dispatch_dev(type, detail) {
	    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
	}
	function append_dev(target, node) {
	    dispatch_dev("SvelteDOMInsert", { target, node });
	    append(target, node);
	}
	function insert_dev(target, node, anchor) {
	    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
	    insert(target, node, anchor);
	}
	function detach_dev(node) {
	    dispatch_dev("SvelteDOMRemove", { node });
	    detach(node);
	}
	function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
	    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
	    if (has_prevent_default)
	        modifiers.push('preventDefault');
	    if (has_stop_propagation)
	        modifiers.push('stopPropagation');
	    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
	    const dispose = listen(node, event, handler, options);
	    return () => {
	        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
	        dispose();
	    };
	}
	function attr_dev(node, attribute, value) {
	    attr(node, attribute, value);
	    if (value == null)
	        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
	    else
	        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
	}
	function set_data_dev(text, data) {
	    data = '' + data;
	    if (text.wholeText === data)
	        return;
	    dispatch_dev("SvelteDOMSetData", { node: text, data });
	    text.data = data;
	}
	function validate_slots(name, slot, keys) {
	    for (const slot_key of Object.keys(slot)) {
	        if (!~keys.indexOf(slot_key)) {
	            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
	        }
	    }
	}
	class SvelteComponentDev extends SvelteComponent {
	    constructor(options) {
	        if (!options || (!options.target && !options.$$inline)) {
	            throw new Error(`'target' is a required option`);
	        }
	        super();
	    }
	    $destroy() {
	        super.$destroy();
	        this.$destroy = () => {
	            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
	        };
	    }
	    $capture_state() { }
	    $inject_state() { }
	}

	/* src/app/components/atoms/Text.svelte generated by Svelte v3.24.1 */

	const file = "src/app/components/atoms/Text.svelte";

	// (68:4) {:else}
	function create_else_block(ctx) {
		let p;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*$$slots*/ ctx[14].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

		const block = {
			c: function create() {
				p = element("p");
				if (default_slot) default_slot.c();
				attr_dev(p, "style", /*style*/ ctx[3]);
				attr_dev(p, "class", "svelte-14tqmsw");
				add_location(p, file, 68, 8, 1913);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);

				if (default_slot) {
					default_slot.m(p, null);
				}

				current = true;

				if (!mounted) {
					dispose = listen_dev(p, "click", /*click_handler_3*/ ctx[18], false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && dirty & /*$$scope*/ 8192) {
						update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
					}
				}

				if (!current || dirty & /*style*/ 8) {
					attr_dev(p, "style", /*style*/ ctx[3]);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(p);
				if (default_slot) default_slot.d(detaching);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(68:4) {:else}",
			ctx
		});

		return block;
	}

	// (66:19) 
	function create_if_block_2(ctx) {
		let p;
		let t;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				p = element("p");
				t = text(/*text*/ ctx[1]);
				attr_dev(p, "style", /*style*/ ctx[3]);
				attr_dev(p, "class", "svelte-14tqmsw");
				add_location(p, file, 66, 8, 1860);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				append_dev(p, t);

				if (!mounted) {
					dispose = listen_dev(p, "click", /*click_handler_2*/ ctx[17], false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);

				if (dirty & /*style*/ 8) {
					attr_dev(p, "style", /*style*/ ctx[3]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(p);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(66:19) ",
			ctx
		});

		return block;
	}

	// (64:19) 
	function create_if_block_1(ctx) {
		let a;
		let t;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				a = element("a");
				t = text(/*text*/ ctx[1]);
				attr_dev(a, "href", /*href*/ ctx[2]);
				attr_dev(a, "style", /*style*/ ctx[3]);
				attr_dev(a, "class", "svelte-14tqmsw");
				add_location(a, file, 64, 8, 1792);
			},
			m: function mount(target, anchor) {
				insert_dev(target, a, anchor);
				append_dev(a, t);

				if (!mounted) {
					dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[16], false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);

				if (dirty & /*href*/ 4) {
					attr_dev(a, "href", /*href*/ ctx[2]);
				}

				if (dirty & /*style*/ 8) {
					attr_dev(a, "style", /*style*/ ctx[3]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(a);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(64:19) ",
			ctx
		});

		return block;
	}

	// (62:4) {#if title}
	function create_if_block(ctx) {
		let h1;
		let t;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				h1 = element("h1");
				t = text(/*text*/ ctx[1]);
				attr_dev(h1, "style", /*style*/ ctx[3]);
				attr_dev(h1, "class", "svelte-14tqmsw");
				add_location(h1, file, 62, 8, 1729);
			},
			m: function mount(target, anchor) {
				insert_dev(target, h1, anchor);
				append_dev(h1, t);

				if (!mounted) {
					dispose = listen_dev(h1, "click", /*click_handler*/ ctx[15], false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);

				if (dirty & /*style*/ 8) {
					attr_dev(h1, "style", /*style*/ ctx[3]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(h1);
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(62:4) {#if title}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_else_block];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*title*/ ctx[0]) return 0;
			if (/*href*/ ctx[2]) return 1;
			if (/*text*/ ctx[1]) return 2;
			return 3;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if_blocks[current_block_type_index].d(detaching);
				if (detaching) detach_dev(if_block_anchor);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let { title = false } = $$props;
		let { text = "" } = $$props;
		let { size = "1em" } = $$props;
		let { color = "auto" } = $$props;
		let { weight = "400" } = $$props;
		let { margin = "0em" } = $$props;
		let { padding = "0em" } = $$props;
		let { align = "left" } = $$props;
		let { href = false } = $$props;
		let { opacity = 1 } = $$props;
		let { w = "auto" } = $$props;
		let { background = "transparent" } = $$props;
		let style;

		const writable_props = [
			"title",
			"text",
			"size",
			"color",
			"weight",
			"margin",
			"padding",
			"align",
			"href",
			"opacity",
			"w",
			"background"
		];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Text> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Text", $$slots, ['default']);

		function click_handler(event) {
			bubble($$self, event);
		}

		function click_handler_1(event) {
			bubble($$self, event);
		}

		function click_handler_2(event) {
			bubble($$self, event);
		}

		function click_handler_3(event) {
			bubble($$self, event);
		}

		$$self.$$set = $$props => {
			if ("title" in $$props) $$invalidate(0, title = $$props.title);
			if ("text" in $$props) $$invalidate(1, text = $$props.text);
			if ("size" in $$props) $$invalidate(4, size = $$props.size);
			if ("color" in $$props) $$invalidate(5, color = $$props.color);
			if ("weight" in $$props) $$invalidate(6, weight = $$props.weight);
			if ("margin" in $$props) $$invalidate(7, margin = $$props.margin);
			if ("padding" in $$props) $$invalidate(8, padding = $$props.padding);
			if ("align" in $$props) $$invalidate(9, align = $$props.align);
			if ("href" in $$props) $$invalidate(2, href = $$props.href);
			if ("opacity" in $$props) $$invalidate(10, opacity = $$props.opacity);
			if ("w" in $$props) $$invalidate(11, w = $$props.w);
			if ("background" in $$props) $$invalidate(12, background = $$props.background);
			if ("$$scope" in $$props) $$invalidate(13, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			title,
			text,
			size,
			color,
			weight,
			margin,
			padding,
			align,
			href,
			opacity,
			w,
			background,
			style
		});

		$$self.$inject_state = $$props => {
			if ("title" in $$props) $$invalidate(0, title = $$props.title);
			if ("text" in $$props) $$invalidate(1, text = $$props.text);
			if ("size" in $$props) $$invalidate(4, size = $$props.size);
			if ("color" in $$props) $$invalidate(5, color = $$props.color);
			if ("weight" in $$props) $$invalidate(6, weight = $$props.weight);
			if ("margin" in $$props) $$invalidate(7, margin = $$props.margin);
			if ("padding" in $$props) $$invalidate(8, padding = $$props.padding);
			if ("align" in $$props) $$invalidate(9, align = $$props.align);
			if ("href" in $$props) $$invalidate(2, href = $$props.href);
			if ("opacity" in $$props) $$invalidate(10, opacity = $$props.opacity);
			if ("w" in $$props) $$invalidate(11, w = $$props.w);
			if ("background" in $$props) $$invalidate(12, background = $$props.background);
			if ("style" in $$props) $$invalidate(3, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*size, color, weight, margin, align, opacity, w, padding, background*/ 8176) {
				 $$invalidate(3, style = `
    --size:${size};
    --color:${color};
    --weight:${weight};
    --margin:${margin};
    --align:${align};
    --opacity:${opacity};
    --width:${w};
    --padding:${padding};
    --background:${background};
    `);
			}
		};

		return [
			title,
			text,
			href,
			style,
			size,
			color,
			weight,
			margin,
			padding,
			align,
			opacity,
			w,
			background,
			$$scope,
			$$slots,
			click_handler,
			click_handler_1,
			click_handler_2,
			click_handler_3
		];
	}

	class Text extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance, create_fragment, safe_not_equal, {
				title: 0,
				text: 1,
				size: 4,
				color: 5,
				weight: 6,
				margin: 7,
				padding: 8,
				align: 9,
				href: 2,
				opacity: 10,
				w: 11,
				background: 12
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Text",
				options,
				id: create_fragment.name
			});
		}

		get title() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set title(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get text() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set text(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get color() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set color(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get weight() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set weight(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get margin() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set margin(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get padding() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set padding(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get align() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set align(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get href() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set href(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get opacity() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set opacity(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get w() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set w(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get background() {
			throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set background(value) {
			throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/app/components/atoms/Icon.svelte generated by Svelte v3.24.1 */

	const file$1 = "src/app/components/atoms/Icon.svelte";

	// (31:4) {:else}
	function create_else_block$1(ctx) {
		let sl_icon;

		const block = {
			c: function create() {
				sl_icon = element("sl-icon");
				set_custom_element_data(sl_icon, "name", /*icon*/ ctx[1]);
				add_location(sl_icon, file$1, 31, 8, 739);
			},
			m: function mount(target, anchor) {
				insert_dev(target, sl_icon, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*icon*/ 2) {
					set_custom_element_data(sl_icon, "name", /*icon*/ ctx[1]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(sl_icon);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$1.name,
			type: "else",
			source: "(31:4) {:else}",
			ctx
		});

		return block;
	}

	// (27:0) {#if circled}
	function create_if_block$1(ctx) {
		let div;
		let sl_icon;

		const block = {
			c: function create() {
				div = element("div");
				sl_icon = element("sl-icon");
				set_custom_element_data(sl_icon, "name", /*icon*/ ctx[1]);
				set_style(sl_icon, "color", /*fgColor*/ ctx[3]);
				set_style(sl_icon, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				add_location(sl_icon, file$1, 28, 8, 625);
				attr_dev(div, "class", "circle svelte-1jlufos");
				attr_dev(div, "style", /*style*/ ctx[4]);
				add_location(div, file$1, 27, 4, 587);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, sl_icon);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*icon*/ 2) {
					set_custom_element_data(sl_icon, "name", /*icon*/ ctx[1]);
				}

				if (dirty & /*fgColor*/ 8) {
					set_style(sl_icon, "color", /*fgColor*/ ctx[3]);
				}

				if (dirty & /*size*/ 1) {
					set_style(sl_icon, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(div);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(27:0) {#if circled}",
			ctx
		});

		return block;
	}

	function create_fragment$1(ctx) {
		let if_block_anchor;

		function select_block_type(ctx, dirty) {
			if (/*circled*/ ctx[2]) return create_if_block$1;
			return create_else_block$1;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if_block.d(detaching);
				if (detaching) detach_dev(if_block_anchor);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { icon = "gear" } = $$props;
		let { circled = false } = $$props;
		let { size = 1 } = $$props;
		let { bgColor = "transparent" } = $$props;
		let { fgColor = "black" } = $$props;
		size = parseInt(size);

		let style = `
                width:${size}em;
                height:${size}em;
                background-color:${bgColor}
                `;

		const writable_props = ["icon", "circled", "size", "bgColor", "fgColor"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Icon", $$slots, []);

		$$self.$$set = $$props => {
			if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
			if ("circled" in $$props) $$invalidate(2, circled = $$props.circled);
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("bgColor" in $$props) $$invalidate(5, bgColor = $$props.bgColor);
			if ("fgColor" in $$props) $$invalidate(3, fgColor = $$props.fgColor);
		};

		$$self.$capture_state = () => ({
			icon,
			circled,
			size,
			bgColor,
			fgColor,
			style
		});

		$$self.$inject_state = $$props => {
			if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
			if ("circled" in $$props) $$invalidate(2, circled = $$props.circled);
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("bgColor" in $$props) $$invalidate(5, bgColor = $$props.bgColor);
			if ("fgColor" in $$props) $$invalidate(3, fgColor = $$props.fgColor);
			if ("style" in $$props) $$invalidate(4, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [size, icon, circled, fgColor, style, bgColor];
	}

	class Icon extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$1, create_fragment$1, safe_not_equal, {
				icon: 1,
				circled: 2,
				size: 0,
				bgColor: 5,
				fgColor: 3
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Icon",
				options,
				id: create_fragment$1.name
			});
		}

		get icon() {
			throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set icon(value) {
			throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get circled() {
			throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set circled(value) {
			throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bgColor() {
			throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bgColor(value) {
			throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fgColor() {
			throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fgColor(value) {
			throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/app/components/atoms/IconButton.svelte generated by Svelte v3.24.1 */

	const file$2 = "src/app/components/atoms/IconButton.svelte";

	// (31:4) {:else}
	function create_else_block$2(ctx) {
		let sl_icon_button;

		const block = {
			c: function create() {
				sl_icon_button = element("sl-icon-button");
				set_custom_element_data(sl_icon_button, "name", /*icon*/ ctx[1]);
				set_style(sl_icon_button, "color", /*fgColor*/ ctx[3]);
				set_style(sl_icon_button, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				add_location(sl_icon_button, file$2, 31, 8, 749);
			},
			m: function mount(target, anchor) {
				insert_dev(target, sl_icon_button, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*icon*/ 2) {
					set_custom_element_data(sl_icon_button, "name", /*icon*/ ctx[1]);
				}

				if (dirty & /*fgColor*/ 8) {
					set_style(sl_icon_button, "color", /*fgColor*/ ctx[3]);
				}

				if (dirty & /*size*/ 1) {
					set_style(sl_icon_button, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(sl_icon_button);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(31:4) {:else}",
			ctx
		});

		return block;
	}

	// (27:0) {#if circled}
	function create_if_block$2(ctx) {
		let div;
		let sl_icon_button;

		const block = {
			c: function create() {
				div = element("div");
				sl_icon_button = element("sl-icon-button");
				set_custom_element_data(sl_icon_button, "name", /*icon*/ ctx[1]);
				set_style(sl_icon_button, "color", /*fgColor*/ ctx[3]);
				set_style(sl_icon_button, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				add_location(sl_icon_button, file$2, 28, 8, 621);
				attr_dev(div, "class", "circle svelte-1jlufos");
				attr_dev(div, "style", /*style*/ ctx[4]);
				add_location(div, file$2, 27, 4, 583);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, sl_icon_button);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*icon*/ 2) {
					set_custom_element_data(sl_icon_button, "name", /*icon*/ ctx[1]);
				}

				if (dirty & /*fgColor*/ 8) {
					set_style(sl_icon_button, "color", /*fgColor*/ ctx[3]);
				}

				if (dirty & /*size*/ 1) {
					set_style(sl_icon_button, "font-size", /*size*/ ctx[0] * 0.8 + "em");
				}
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(div);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(27:0) {#if circled}",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let if_block_anchor;

		function select_block_type(ctx, dirty) {
			if (/*circled*/ ctx[2]) return create_if_block$2;
			return create_else_block$2;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if_block.d(detaching);
				if (detaching) detach_dev(if_block_anchor);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { icon = "gear" } = $$props;
		let { circled = false } = $$props;
		let { size = 1 } = $$props;
		let { bgColor = "#15CEBC" } = $$props;
		let { fgColor = "white" } = $$props;
		size = parseInt(size);

		let style = `
                width:${size}em;
                height:${size}em;
                background-color:${bgColor}
                `;

		const writable_props = ["icon", "circled", "size", "bgColor", "fgColor"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IconButton> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("IconButton", $$slots, []);

		$$self.$$set = $$props => {
			if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
			if ("circled" in $$props) $$invalidate(2, circled = $$props.circled);
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("bgColor" in $$props) $$invalidate(5, bgColor = $$props.bgColor);
			if ("fgColor" in $$props) $$invalidate(3, fgColor = $$props.fgColor);
		};

		$$self.$capture_state = () => ({
			icon,
			circled,
			size,
			bgColor,
			fgColor,
			style
		});

		$$self.$inject_state = $$props => {
			if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
			if ("circled" in $$props) $$invalidate(2, circled = $$props.circled);
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("bgColor" in $$props) $$invalidate(5, bgColor = $$props.bgColor);
			if ("fgColor" in $$props) $$invalidate(3, fgColor = $$props.fgColor);
			if ("style" in $$props) $$invalidate(4, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [size, icon, circled, fgColor, style, bgColor];
	}

	class IconButton extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$2, create_fragment$2, safe_not_equal, {
				icon: 1,
				circled: 2,
				size: 0,
				bgColor: 5,
				fgColor: 3
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "IconButton",
				options,
				id: create_fragment$2.name
			});
		}

		get icon() {
			throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set icon(value) {
			throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get circled() {
			throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set circled(value) {
			throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get size() {
			throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bgColor() {
			throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bgColor(value) {
			throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fgColor() {
			throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fgColor(value) {
			throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/app/components/atoms/Group.svelte generated by Svelte v3.24.1 */

	const file$3 = "src/app/components/atoms/Group.svelte";

	function create_fragment$3(ctx) {
		let div;
		let current;
		const default_slot_template = /*$$slots*/ ctx[5].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				attr_dev(div, "class", "Group svelte-1hh1356");
				attr_dev(div, "style", /*style*/ ctx[0]);
				add_location(div, file$3, 22, 0, 508);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && dirty & /*$$scope*/ 16) {
						update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(div);
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { direction = "column" } = $$props;
		let { width = "auto" } = $$props;
		let { justify = "flex-start" } = $$props;

		let style = `
                --direction:${direction};
                --width:${width};
                --justify:${justify};
                `;

		const writable_props = ["direction", "width", "justify"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Group> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Group", $$slots, ['default']);

		$$self.$$set = $$props => {
			if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
			if ("width" in $$props) $$invalidate(2, width = $$props.width);
			if ("justify" in $$props) $$invalidate(3, justify = $$props.justify);
			if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({ direction, width, justify, style });

		$$self.$inject_state = $$props => {
			if ("direction" in $$props) $$invalidate(1, direction = $$props.direction);
			if ("width" in $$props) $$invalidate(2, width = $$props.width);
			if ("justify" in $$props) $$invalidate(3, justify = $$props.justify);
			if ("style" in $$props) $$invalidate(0, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [style, direction, width, justify, $$scope, $$slots];
	}

	class Group extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, { direction: 1, width: 2, justify: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Group",
				options,
				id: create_fragment$3.name
			});
		}

		get direction() {
			throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set direction(value) {
			throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get width() {
			throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set width(value) {
			throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get justify() {
			throw new Error("<Group>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set justify(value) {
			throw new Error("<Group>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/app/components/atoms/Avatar.svelte generated by Svelte v3.24.1 */

	const file$4 = "src/app/components/atoms/Avatar.svelte";

	function create_fragment$4(ctx) {
		let sl_avatar;

		const block = {
			c: function create() {
				sl_avatar = element("sl-avatar");
				set_custom_element_data(sl_avatar, "image", "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80");
				set_custom_element_data(sl_avatar, "alt", "Gray tabby kitten looking down");
				add_location(sl_avatar, file$4, 14, 0, 175);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, sl_avatar, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) detach_dev(sl_avatar);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { size = 1 } = $$props;
		size = parseInt(size);

		let style = `
                --size:${size}em;
                `;

		const writable_props = ["size"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Avatar> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Avatar", $$slots, []);

		$$self.$$set = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
		};

		$$self.$capture_state = () => ({ size, style });

		$$self.$inject_state = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("style" in $$props) style = $$props.style;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [size];
	}

	class Avatar extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, { size: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Avatar",
				options,
				id: create_fragment$4.name
			});
		}

		get size() {
			throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	var atoms = {
	    Text : Text,
	    Icon : Icon,
	    IconButton : IconButton,
	    Avatar : Avatar
	};

	const Text$1 = Text;
	const Icon$1 = Icon;
	const IconButton$1 = IconButton;
	const Group$1 = Group;
	const Avatar$1 = Avatar;

	/* src/app/components/molecules/IconText.svelte generated by Svelte v3.24.1 */
	const file$5 = "src/app/components/molecules/IconText.svelte";

	// (25:4) <Text color={textColor} {size}>
	function create_default_slot(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Settings");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(t);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(25:4) <Text color={textColor} {size}>",
			ctx
		});

		return block;
	}

	function create_fragment$5(ctx) {
		let div;
		let icon;
		let t;
		let text_1;
		let current;

		icon = new Icon$1({
				props: {
					circled: true,
					size: /*size*/ ctx[0],
					fgColor: /*fgColor*/ ctx[1],
					bgColor: /*bgColor*/ ctx[2]
				},
				$$inline: true
			});

		text_1 = new Text$1({
				props: {
					color: /*textColor*/ ctx[3],
					size: /*size*/ ctx[0],
					$$slots: { default: [create_default_slot] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(icon.$$.fragment);
				t = space();
				create_component(text_1.$$.fragment);
				attr_dev(div, "class", "IconText svelte-1s1pegg");
				attr_dev(div, "style", /*style*/ ctx[4]);
				add_location(div, file$5, 22, 0, 415);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(icon, div, null);
				append_dev(div, t);
				mount_component(text_1, div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const icon_changes = {};
				if (dirty & /*size*/ 1) icon_changes.size = /*size*/ ctx[0];
				if (dirty & /*fgColor*/ 2) icon_changes.fgColor = /*fgColor*/ ctx[1];
				if (dirty & /*bgColor*/ 4) icon_changes.bgColor = /*bgColor*/ ctx[2];
				icon.$set(icon_changes);
				const text_1_changes = {};
				if (dirty & /*textColor*/ 8) text_1_changes.color = /*textColor*/ ctx[3];
				if (dirty & /*size*/ 1) text_1_changes.size = /*size*/ ctx[0];

				if (dirty & /*$$scope*/ 32) {
					text_1_changes.$$scope = { dirty, ctx };
				}

				text_1.$set(text_1_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(icon.$$.fragment, local);
				transition_in(text_1.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(icon.$$.fragment, local);
				transition_out(text_1.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(div);
				destroy_component(icon);
				destroy_component(text_1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { size = 1 } = $$props;
		let { fgColor = "white" } = $$props;
		let { bgColor = "#15CEBC" } = $$props;
		let { textColor = "black" } = $$props;
		size = parseInt(size);
		let style = `--line-height:${size}em`;
		const writable_props = ["size", "fgColor", "bgColor", "textColor"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IconText> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("IconText", $$slots, []);

		$$self.$$set = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("fgColor" in $$props) $$invalidate(1, fgColor = $$props.fgColor);
			if ("bgColor" in $$props) $$invalidate(2, bgColor = $$props.bgColor);
			if ("textColor" in $$props) $$invalidate(3, textColor = $$props.textColor);
		};

		$$self.$capture_state = () => ({
			Icon: Icon$1,
			Text: Text$1,
			size,
			fgColor,
			bgColor,
			textColor,
			style
		});

		$$self.$inject_state = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("fgColor" in $$props) $$invalidate(1, fgColor = $$props.fgColor);
			if ("bgColor" in $$props) $$invalidate(2, bgColor = $$props.bgColor);
			if ("textColor" in $$props) $$invalidate(3, textColor = $$props.textColor);
			if ("style" in $$props) $$invalidate(4, style = $$props.style);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [size, fgColor, bgColor, textColor, style];
	}

	class IconText extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$5, create_fragment$5, safe_not_equal, {
				size: 0,
				fgColor: 1,
				bgColor: 2,
				textColor: 3
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "IconText",
				options,
				id: create_fragment$5.name
			});
		}

		get size() {
			throw new Error("<IconText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<IconText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get fgColor() {
			throw new Error("<IconText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set fgColor(value) {
			throw new Error("<IconText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get bgColor() {
			throw new Error("<IconText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bgColor(value) {
			throw new Error("<IconText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get textColor() {
			throw new Error("<IconText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set textColor(value) {
			throw new Error("<IconText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/app/components/molecules/User.svelte generated by Svelte v3.24.1 */
	const file$6 = "src/app/components/molecules/User.svelte";

	// (34:8) <Text color={textColor} {size}>
	function create_default_slot_1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Settings");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(t);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1.name,
			type: "slot",
			source: "(34:8) <Text color={textColor} {size}>",
			ctx
		});

		return block;
	}

	// (35:8) <Text color={textColor} size={smaller}>
	function create_default_slot$1(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Settings");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(t);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$1.name,
			type: "slot",
			source: "(35:8) <Text color={textColor} size={smaller}>",
			ctx
		});

		return block;
	}

	function create_fragment$6(ctx) {
		let div1;
		let avatar;
		let t0;
		let div0;
		let text0;
		let t1;
		let text1;
		let current;

		avatar = new Avatar$1({
				props: { size: /*size*/ ctx[0] },
				$$inline: true
			});

		text0 = new Text$1({
				props: {
					color: /*textColor*/ ctx[1],
					size: /*size*/ ctx[0],
					$$slots: { default: [create_default_slot_1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		text1 = new Text$1({
				props: {
					color: /*textColor*/ ctx[1],
					size: /*smaller*/ ctx[2],
					$$slots: { default: [create_default_slot$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				div1 = element("div");
				create_component(avatar.$$.fragment);
				t0 = space();
				div0 = element("div");
				create_component(text0.$$.fragment);
				t1 = space();
				create_component(text1.$$.fragment);
				attr_dev(div0, "class", "UserData svelte-1bt6nw4");
				add_location(div0, file$6, 32, 4, 653);
				attr_dev(div1, "class", "User svelte-1bt6nw4");
				attr_dev(div1, "style", /*style*/ ctx[3]);
				add_location(div1, file$6, 30, 0, 591);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				mount_component(avatar, div1, null);
				append_dev(div1, t0);
				append_dev(div1, div0);
				mount_component(text0, div0, null);
				append_dev(div0, t1);
				mount_component(text1, div0, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const avatar_changes = {};
				if (dirty & /*size*/ 1) avatar_changes.size = /*size*/ ctx[0];
				avatar.$set(avatar_changes);
				const text0_changes = {};
				if (dirty & /*textColor*/ 2) text0_changes.color = /*textColor*/ ctx[1];
				if (dirty & /*size*/ 1) text0_changes.size = /*size*/ ctx[0];

				if (dirty & /*$$scope*/ 32) {
					text0_changes.$$scope = { dirty, ctx };
				}

				text0.$set(text0_changes);
				const text1_changes = {};
				if (dirty & /*textColor*/ 2) text1_changes.color = /*textColor*/ ctx[1];
				if (dirty & /*smaller*/ 4) text1_changes.size = /*smaller*/ ctx[2];

				if (dirty & /*$$scope*/ 32) {
					text1_changes.$$scope = { dirty, ctx };
				}

				text1.$set(text1_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(avatar.$$.fragment, local);
				transition_in(text0.$$.fragment, local);
				transition_in(text1.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(avatar.$$.fragment, local);
				transition_out(text0.$$.fragment, local);
				transition_out(text1.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(div1);
				destroy_component(avatar);
				destroy_component(text0);
				destroy_component(text1);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let { size = 1 } = $$props;
		let { textColor = "black" } = $$props;
		let { margin = "auto" } = $$props;
		size = parseInt(size);
		let style = `--color:${textColor};--margin:${margin}`;
		const writable_props = ["size", "textColor", "margin"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("User", $$slots, []);

		$$self.$$set = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("textColor" in $$props) $$invalidate(1, textColor = $$props.textColor);
			if ("margin" in $$props) $$invalidate(4, margin = $$props.margin);
		};

		$$self.$capture_state = () => ({
			Avatar: Avatar$1,
			Text: Text$1,
			size,
			textColor,
			margin,
			style,
			smaller
		});

		$$self.$inject_state = $$props => {
			if ("size" in $$props) $$invalidate(0, size = $$props.size);
			if ("textColor" in $$props) $$invalidate(1, textColor = $$props.textColor);
			if ("margin" in $$props) $$invalidate(4, margin = $$props.margin);
			if ("style" in $$props) $$invalidate(3, style = $$props.style);
			if ("smaller" in $$props) $$invalidate(2, smaller = $$props.smaller);
		};

		let smaller;

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*size*/ 1) {
				 $$invalidate(2, smaller = `${size * 0.8}em`);
			}
		};

		return [size, textColor, smaller, style, margin];
	}

	class User extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 0, textColor: 1, margin: 4 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "User",
				options,
				id: create_fragment$6.name
			});
		}

		get size() {
			throw new Error("<User>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set size(value) {
			throw new Error("<User>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get textColor() {
			throw new Error("<User>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set textColor(value) {
			throw new Error("<User>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get margin() {
			throw new Error("<User>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set margin(value) {
			throw new Error("<User>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	var molecules = {
	    IconText : IconText,
	    User : User
	};

	const IconText$1 = IconText;
	const User$1 = User;

	/* src/app/components/organisms/ModuleHeader.svelte generated by Svelte v3.24.1 */

	// (10:4) <Group direction="row">
	function create_default_slot_1$1(ctx) {
		let iconbutton0;
		let t0;
		let iconbutton1;
		let t1;
		let iconbutton2;
		let t2;
		let user;
		let current;

		iconbutton0 = new IconButton$1({
				props: { size: "2", icon: "graph-up" },
				$$inline: true
			});

		iconbutton1 = new IconButton$1({
				props: { size: "2", icon: "bell" },
				$$inline: true
			});

		iconbutton2 = new IconButton$1({
				props: { size: "2", icon: "grid-3x3-gap" },
				$$inline: true
			});

		user = new User$1({
				props: { margin: "0em 0em 0em 2em" },
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(iconbutton0.$$.fragment);
				t0 = space();
				create_component(iconbutton1.$$.fragment);
				t1 = space();
				create_component(iconbutton2.$$.fragment);
				t2 = space();
				create_component(user.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(iconbutton0, target, anchor);
				insert_dev(target, t0, anchor);
				mount_component(iconbutton1, target, anchor);
				insert_dev(target, t1, anchor);
				mount_component(iconbutton2, target, anchor);
				insert_dev(target, t2, anchor);
				mount_component(user, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(iconbutton0.$$.fragment, local);
				transition_in(iconbutton1.$$.fragment, local);
				transition_in(iconbutton2.$$.fragment, local);
				transition_in(user.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(iconbutton0.$$.fragment, local);
				transition_out(iconbutton1.$$.fragment, local);
				transition_out(iconbutton2.$$.fragment, local);
				transition_out(user.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(iconbutton0, detaching);
				if (detaching) detach_dev(t0);
				destroy_component(iconbutton1, detaching);
				if (detaching) detach_dev(t1);
				destroy_component(iconbutton2, detaching);
				if (detaching) detach_dev(t2);
				destroy_component(user, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot_1$1.name,
			type: "slot",
			source: "(10:4) <Group direction=\\\"row\\\">",
			ctx
		});

		return block;
	}

	// (6:0) <Group direction="row" width="100%" justify="space-between">
	function create_default_slot$2(ctx) {
		let icontext;
		let t;
		let group;
		let current;
		icontext = new IconText$1({ $$inline: true });

		group = new Group$1({
				props: {
					direction: "row",
					$$slots: { default: [create_default_slot_1$1] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(icontext.$$.fragment);
				t = space();
				create_component(group.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(icontext, target, anchor);
				insert_dev(target, t, anchor);
				mount_component(group, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const group_changes = {};

				if (dirty & /*$$scope*/ 1) {
					group_changes.$$scope = { dirty, ctx };
				}

				group.$set(group_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(icontext.$$.fragment, local);
				transition_in(group.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(icontext.$$.fragment, local);
				transition_out(group.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(icontext, detaching);
				if (detaching) detach_dev(t);
				destroy_component(group, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot$2.name,
			type: "slot",
			source: "(6:0) <Group direction=\\\"row\\\" width=\\\"100%\\\" justify=\\\"space-between\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let group;
		let current;

		group = new Group$1({
				props: {
					direction: "row",
					width: "100%",
					justify: "space-between",
					$$slots: { default: [create_default_slot$2] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(group.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(group, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const group_changes = {};

				if (dirty & /*$$scope*/ 1) {
					group_changes.$$scope = { dirty, ctx };
				}

				group.$set(group_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(group.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(group.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(group, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$7($$self, $$props, $$invalidate) {
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ModuleHeader> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("ModuleHeader", $$slots, []);
		$$self.$capture_state = () => ({ Group: Group$1, IconButton: IconButton$1, User: User$1, IconText: IconText$1 });
		return [];
	}

	class ModuleHeader extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "ModuleHeader",
				options,
				id: create_fragment$7.name
			});
		}
	}

	var organisms = {
	    ModuleHeader : ModuleHeader
	};

	const ModuleHeader$1 = ModuleHeader;

	/* src/app/components/templates/Module.svelte generated by Svelte v3.24.1 */

	const file$7 = "src/app/components/templates/Module.svelte";
	const get_main_slot_changes = dirty => ({});
	const get_main_slot_context = ctx => ({});
	const get_aside_slot_changes = dirty => ({});
	const get_aside_slot_context = ctx => ({});
	const get_nav_slot_changes = dirty => ({});
	const get_nav_slot_context = ctx => ({});
	const get_header_slot_changes = dirty => ({});
	const get_header_slot_context = ctx => ({});

	function create_fragment$8(ctx) {
		let header;
		let t0;
		let nav;
		let t1;
		let aside;
		let t2;
		let main;
		let current;
		const header_slot_template = /*$$slots*/ ctx[1].header;
		const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[0], get_header_slot_context);
		const nav_slot_template = /*$$slots*/ ctx[1].nav;
		const nav_slot = create_slot(nav_slot_template, ctx, /*$$scope*/ ctx[0], get_nav_slot_context);
		const aside_slot_template = /*$$slots*/ ctx[1].aside;
		const aside_slot = create_slot(aside_slot_template, ctx, /*$$scope*/ ctx[0], get_aside_slot_context);
		const main_slot_template = /*$$slots*/ ctx[1].main;
		const main_slot = create_slot(main_slot_template, ctx, /*$$scope*/ ctx[0], get_main_slot_context);

		const block = {
			c: function create() {
				header = element("header");
				if (header_slot) header_slot.c();
				t0 = space();
				nav = element("nav");
				if (nav_slot) nav_slot.c();
				t1 = space();
				aside = element("aside");
				if (aside_slot) aside_slot.c();
				t2 = space();
				main = element("main");
				if (main_slot) main_slot.c();
				add_location(header, file$7, 0, 0, 0);
				add_location(nav, file$7, 4, 0, 56);
				add_location(aside, file$7, 8, 0, 103);
				add_location(main, file$7, 12, 0, 156);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, header, anchor);

				if (header_slot) {
					header_slot.m(header, null);
				}

				insert_dev(target, t0, anchor);
				insert_dev(target, nav, anchor);

				if (nav_slot) {
					nav_slot.m(nav, null);
				}

				insert_dev(target, t1, anchor);
				insert_dev(target, aside, anchor);

				if (aside_slot) {
					aside_slot.m(aside, null);
				}

				insert_dev(target, t2, anchor);
				insert_dev(target, main, anchor);

				if (main_slot) {
					main_slot.m(main, null);
				}

				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (header_slot) {
					if (header_slot.p && dirty & /*$$scope*/ 1) {
						update_slot(header_slot, header_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_header_slot_changes, get_header_slot_context);
					}
				}

				if (nav_slot) {
					if (nav_slot.p && dirty & /*$$scope*/ 1) {
						update_slot(nav_slot, nav_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_nav_slot_changes, get_nav_slot_context);
					}
				}

				if (aside_slot) {
					if (aside_slot.p && dirty & /*$$scope*/ 1) {
						update_slot(aside_slot, aside_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_aside_slot_changes, get_aside_slot_context);
					}
				}

				if (main_slot) {
					if (main_slot.p && dirty & /*$$scope*/ 1) {
						update_slot(main_slot, main_slot_template, ctx, /*$$scope*/ ctx[0], dirty, get_main_slot_changes, get_main_slot_context);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(header_slot, local);
				transition_in(nav_slot, local);
				transition_in(aside_slot, local);
				transition_in(main_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(header_slot, local);
				transition_out(nav_slot, local);
				transition_out(aside_slot, local);
				transition_out(main_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(header);
				if (header_slot) header_slot.d(detaching);
				if (detaching) detach_dev(t0);
				if (detaching) detach_dev(nav);
				if (nav_slot) nav_slot.d(detaching);
				if (detaching) detach_dev(t1);
				if (detaching) detach_dev(aside);
				if (aside_slot) aside_slot.d(detaching);
				if (detaching) detach_dev(t2);
				if (detaching) detach_dev(main);
				if (main_slot) main_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$8.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$8($$self, $$props, $$invalidate) {
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Module> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Module", $$slots, ['header','nav','aside','main']);

		$$self.$$set = $$props => {
			if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
		};

		return [$$scope, $$slots];
	}

	class Module extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Module",
				options,
				id: create_fragment$8.name
			});
		}
	}

	var templates = {
	    Module : Module
	};

	const Module$1 = Module;

	var componentIndex = {
	    atoms,
	    molecules,
	    organisms,
	    templates
	};

	let formatDate = function(date = new Date(), locale = "es-GT", options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }){
	    // gets date, locale? and options? parameters and returns formatted date
	    let dateObject = new Date(date);
	    return dateObject.toLocaleString(locale, options)
	};

	var helperIndex = {
	    formatDate
	};

	var interceptorIndex = {
	    interceptor : ()=>{}
	};

	/* src/app/modules/form/pages/home.page.svelte generated by Svelte v3.24.1 */
	const file$8 = "src/app/modules/form/pages/home.page.svelte";

	// (6:4) <span slot="header">
	function create_header_slot(ctx) {
		let span;
		let moduleheader;
		let current;
		moduleheader = new ModuleHeader$1({ $$inline: true });

		const block = {
			c: function create() {
				span = element("span");
				create_component(moduleheader.$$.fragment);
				attr_dev(span, "slot", "header");
				add_location(span, file$8, 5, 4, 116);
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				mount_component(moduleheader, span, null);
				current = true;
			},
			i: function intro(local) {
				if (current) return;
				transition_in(moduleheader.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(moduleheader.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(span);
				destroy_component(moduleheader);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_header_slot.name,
			type: "slot",
			source: "(6:4) <span slot=\\\"header\\\">",
			ctx
		});

		return block;
	}

	function create_fragment$9(ctx) {
		let module;
		let current;

		module = new Module$1({
				props: {
					$$slots: { header: [create_header_slot] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(module.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(module, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const module_changes = {};

				if (dirty & /*$$scope*/ 1) {
					module_changes.$$scope = { dirty, ctx };
				}

				module.$set(module_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(module.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(module.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(module, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$9.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$9($$self, $$props, $$invalidate) {
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home_page> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Home_page", $$slots, []);
		$$self.$capture_state = () => ({ ModuleHeader: ModuleHeader$1, Module: Module$1 });
		return [];
	}

	class Home_page extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Home_page",
				options,
				id: create_fragment$9.name
			});
		}
	}

	var FormModule = {
		Home : Home_page
	};

	var moduleIndex = {
	    FormModule
	};

	var bind = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};

	/*global toString:true*/

	// utils is a library of generic helper functions non-specific to axios

	var toString = Object.prototype.toString;

	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}

	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}

	/**
	 * Determine if a value is a Buffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Buffer, otherwise false
	 */
	function isBuffer(val) {
	  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
	    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
	}

	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}

	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}

	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}

	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}

	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}

	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}

	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}

	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}

	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}

	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}

	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}

	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}

	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}

	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 * nativescript
	 *  navigator.product -> 'NativeScript' or 'NS'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
	                                           navigator.product === 'NativeScript' ||
	                                           navigator.product === 'NS')) {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}

	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }

	  // Force an array if not already something iterable
	  if (typeof obj !== 'object') {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }

	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}

	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }

	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}

	/**
	 * Function equal to merge with the difference being that no reference
	 * to original objects is kept.
	 *
	 * @see merge
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function deepMerge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = deepMerge(result[key], val);
	    } else if (typeof val === 'object') {
	      result[key] = deepMerge({}, val);
	    } else {
	      result[key] = val;
	    }
	  }

	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}

	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}

	var utils = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  deepMerge: deepMerge,
	  extend: extend,
	  trim: trim
	};

	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}

	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	var buildURL = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }

	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];

	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }

	      if (utils.isArray(val)) {
	        key = key + '[]';
	      } else {
	        val = [val];
	      }

	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });

	    serializedParams = parts.join('&');
	  }

	  if (serializedParams) {
	    var hashmarkIndex = url.indexOf('#');
	    if (hashmarkIndex !== -1) {
	      url = url.slice(0, hashmarkIndex);
	    }

	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }

	  return url;
	};

	function InterceptorManager() {
	  this.handlers = [];
	}

	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};

	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};

	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};

	var InterceptorManager_1 = InterceptorManager;

	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	var transformData = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });

	  return data;
	};

	var isCancel = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};

	var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};

	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	var enhanceError = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }

	  error.request = request;
	  error.response = response;
	  error.isAxiosError = true;

	  error.toJSON = function() {
	    return {
	      // Standard
	      message: this.message,
	      name: this.name,
	      // Microsoft
	      description: this.description,
	      number: this.number,
	      // Mozilla
	      fileName: this.fileName,
	      lineNumber: this.lineNumber,
	      columnNumber: this.columnNumber,
	      stack: this.stack,
	      // Axios
	      config: this.config,
	      code: this.code
	    };
	  };
	  return error;
	};

	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	var createError = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};

	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	var settle = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  if (!validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};

	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	var isAbsoluteURL = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};

	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	var combineURLs = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};

	/**
	 * Creates a new URL by combining the baseURL with the requestedURL,
	 * only when the requestedURL is not already an absolute URL.
	 * If the requestURL is absolute, this function returns the requestedURL untouched.
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} requestedURL Absolute or relative URL to combine
	 * @returns {string} The combined full path
	 */
	var buildFullPath = function buildFullPath(baseURL, requestedURL) {
	  if (baseURL && !isAbsoluteURL(requestedURL)) {
	    return combineURLs(baseURL, requestedURL);
	  }
	  return requestedURL;
	};

	// Headers whose duplicates are ignored by node
	// c.f. https://nodejs.org/api/http.html#http_message_headers
	var ignoreDuplicateOf = [
	  'age', 'authorization', 'content-length', 'content-type', 'etag',
	  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
	  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
	  'referer', 'retry-after', 'user-agent'
	];

	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	var parseHeaders = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;

	  if (!headers) { return parsed; }

	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));

	    if (key) {
	      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
	        return;
	      }
	      if (key === 'set-cookie') {
	        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
	      } else {
	        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	      }
	    }
	  });

	  return parsed;
	};

	var isURLSameOrigin = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	    (function standardBrowserEnv() {
	      var msie = /(msie|trident)/i.test(navigator.userAgent);
	      var urlParsingNode = document.createElement('a');
	      var originURL;

	      /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	      function resolveURL(url) {
	        var href = url;

	        if (msie) {
	        // IE needs attribute set twice to normalize properties
	          urlParsingNode.setAttribute('href', href);
	          href = urlParsingNode.href;
	        }

	        urlParsingNode.setAttribute('href', href);

	        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	        return {
	          href: urlParsingNode.href,
	          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	          host: urlParsingNode.host,
	          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	          hostname: urlParsingNode.hostname,
	          port: urlParsingNode.port,
	          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	            urlParsingNode.pathname :
	            '/' + urlParsingNode.pathname
	        };
	      }

	      originURL = resolveURL(window.location.href);

	      /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	      return function isURLSameOrigin(requestURL) {
	        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	        return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	      };
	    })() :

	  // Non standard browser envs (web workers, react-native) lack needed support.
	    (function nonStandardBrowserEnv() {
	      return function isURLSameOrigin() {
	        return true;
	      };
	    })()
	);

	var cookies = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs support document.cookie
	    (function standardBrowserEnv() {
	      return {
	        write: function write(name, value, expires, path, domain, secure) {
	          var cookie = [];
	          cookie.push(name + '=' + encodeURIComponent(value));

	          if (utils.isNumber(expires)) {
	            cookie.push('expires=' + new Date(expires).toGMTString());
	          }

	          if (utils.isString(path)) {
	            cookie.push('path=' + path);
	          }

	          if (utils.isString(domain)) {
	            cookie.push('domain=' + domain);
	          }

	          if (secure === true) {
	            cookie.push('secure');
	          }

	          document.cookie = cookie.join('; ');
	        },

	        read: function read(name) {
	          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	          return (match ? decodeURIComponent(match[3]) : null);
	        },

	        remove: function remove(name) {
	          this.write(name, '', Date.now() - 86400000);
	        }
	      };
	    })() :

	  // Non standard browser env (web workers, react-native) lack needed support.
	    (function nonStandardBrowserEnv() {
	      return {
	        write: function write() {},
	        read: function read() { return null; },
	        remove: function remove() {}
	      };
	    })()
	);

	var xhr = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;

	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }

	    var request = new XMLHttpRequest();

	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }

	    var fullPath = buildFullPath(config.baseURL, config.url);
	    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

	    // Set the request timeout in MS
	    request.timeout = config.timeout;

	    // Listen for ready state
	    request.onreadystatechange = function handleLoad() {
	      if (!request || request.readyState !== 4) {
	        return;
	      }

	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }

	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        status: request.status,
	        statusText: request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };

	      settle(resolve, reject, response);

	      // Clean up request
	      request = null;
	    };

	    // Handle browser request cancellation (as opposed to a manual cancellation)
	    request.onabort = function handleAbort() {
	      if (!request) {
	        return;
	      }

	      reject(createError('Request aborted', config, 'ECONNABORTED', request));

	      // Clean up request
	      request = null;
	    };

	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));

	      // Clean up request
	      request = null;
	    };

	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
	      if (config.timeoutErrorMessage) {
	        timeoutErrorMessage = config.timeoutErrorMessage;
	      }
	      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
	        request));

	      // Clean up request
	      request = null;
	    };

	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies$1 = cookies;

	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
	        cookies$1.read(config.xsrfCookieName) :
	        undefined;

	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }

	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }

	    // Add withCredentials to request if needed
	    if (!utils.isUndefined(config.withCredentials)) {
	      request.withCredentials = !!config.withCredentials;
	    }

	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }

	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }

	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }

	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }

	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }

	    if (requestData === undefined) {
	      requestData = null;
	    }

	    // Send the request
	    request.send(requestData);
	  });
	};

	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};

	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}

	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = xhr;
	  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
	    // For node use HTTP adapter
	    adapter = xhr;
	  }
	  return adapter;
	}

	var defaults = {
	  adapter: getDefaultAdapter(),

	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Accept');
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],

	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],

	  /**
	   * A timeout in milliseconds to abort a request. If set to 0 (default) a
	   * timeout is not created.
	   */
	  timeout: 0,

	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',

	  maxContentLength: -1,

	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};

	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};

	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});

	var defaults_1 = defaults;

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}

	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	var dispatchRequest = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);

	  // Ensure headers exist
	  config.headers = config.headers || {};

	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );

	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers
	  );

	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );

	  var adapter = config.adapter || defaults_1.adapter;

	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);

	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );

	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);

	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }

	    return Promise.reject(reason);
	  });
	};

	/**
	 * Config-specific merge-function which creates a new config-object
	 * by merging two configuration objects together.
	 *
	 * @param {Object} config1
	 * @param {Object} config2
	 * @returns {Object} New object resulting from merging config2 to config1
	 */
	var mergeConfig = function mergeConfig(config1, config2) {
	  // eslint-disable-next-line no-param-reassign
	  config2 = config2 || {};
	  var config = {};

	  var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];
	  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];
	  var defaultToConfig2Keys = [
	    'baseURL', 'url', 'transformRequest', 'transformResponse', 'paramsSerializer',
	    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
	    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress',
	    'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent',
	    'httpsAgent', 'cancelToken', 'socketPath'
	  ];

	  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
	    if (typeof config2[prop] !== 'undefined') {
	      config[prop] = config2[prop];
	    }
	  });

	  utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
	    if (utils.isObject(config2[prop])) {
	      config[prop] = utils.deepMerge(config1[prop], config2[prop]);
	    } else if (typeof config2[prop] !== 'undefined') {
	      config[prop] = config2[prop];
	    } else if (utils.isObject(config1[prop])) {
	      config[prop] = utils.deepMerge(config1[prop]);
	    } else if (typeof config1[prop] !== 'undefined') {
	      config[prop] = config1[prop];
	    }
	  });

	  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
	    if (typeof config2[prop] !== 'undefined') {
	      config[prop] = config2[prop];
	    } else if (typeof config1[prop] !== 'undefined') {
	      config[prop] = config1[prop];
	    }
	  });

	  var axiosKeys = valueFromConfig2Keys
	    .concat(mergeDeepPropertiesKeys)
	    .concat(defaultToConfig2Keys);

	  var otherKeys = Object
	    .keys(config2)
	    .filter(function filterAxiosKeys(key) {
	      return axiosKeys.indexOf(key) === -1;
	    });

	  utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
	    if (typeof config2[prop] !== 'undefined') {
	      config[prop] = config2[prop];
	    } else if (typeof config1[prop] !== 'undefined') {
	      config[prop] = config1[prop];
	    }
	  });

	  return config;
	};

	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager_1(),
	    response: new InterceptorManager_1()
	  };
	}

	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = arguments[1] || {};
	    config.url = arguments[0];
	  } else {
	    config = config || {};
	  }

	  config = mergeConfig(this.defaults, config);

	  // Set config.method
	  if (config.method) {
	    config.method = config.method.toLowerCase();
	  } else if (this.defaults.method) {
	    config.method = this.defaults.method.toLowerCase();
	  } else {
	    config.method = 'get';
	  }

	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);

	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });

	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });

	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }

	  return promise;
	};

	Axios.prototype.getUri = function getUri(config) {
	  config = mergeConfig(this.defaults, config);
	  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
	};

	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});

	var Axios_1 = Axios;

	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}

	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};

	Cancel.prototype.__CANCEL__ = true;

	var Cancel_1 = Cancel;

	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }

	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });

	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }

	    token.reason = new Cancel_1(message);
	    resolvePromise(token.reason);
	  });
	}

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};

	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};

	var CancelToken_1 = CancelToken;

	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	var spread = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};

	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios_1(defaultConfig);
	  var instance = bind(Axios_1.prototype.request, context);

	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios_1.prototype, context);

	  // Copy context to instance
	  utils.extend(instance, context);

	  return instance;
	}

	// Create the default instance to be exported
	var axios = createInstance(defaults_1);

	// Expose Axios class to allow class inheritance
	axios.Axios = Axios_1;

	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(mergeConfig(axios.defaults, instanceConfig));
	};

	// Expose Cancel & CancelToken
	axios.Cancel = Cancel_1;
	axios.CancelToken = CancelToken_1;
	axios.isCancel = isCancel;

	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = spread;

	var axios_1 = axios;

	// Allow use of default import syntax in TypeScript
	var _default = axios;
	axios_1.default = _default;

	var axios$1 = axios_1;

	const client = axios$1.create({
	    baseURL: 'http://localhost:3000/',
	    // timeout: 1000
	});

	const apiRequest = async (method, url, request)=>{
	    return await client({
	        method,
	        url,
	        data : request
	    })
	};

	const get = async(url, request) => apiRequest("get", url, request);
	const post = async(url, request) => apiRequest("post", url, request);
	const put = async(url, request) => apiRequest("put", url, request);
	const deleteRequest = async(url, request) => apiRequest("delete", url, request);

	const API = {
	    instance : client,
	    get,
	    post,
	    put,
	    delete : deleteRequest
	};

	const signIn = async (data, config)=>{
	    return await API.post(`auth/signin`, data, config)
	};

	const forgotPassword = async (data, config)=>{
	    return await API.post(`auth/reset`, data, config)
	};

	const confirmPassword = async (data, config)=>{
	    return await API.put(`auth/reset`, data, config)
	};

	const create = async (data, query, config)=>{
	    return await API.post(`api/user?${query}`, data, config)
	};

	const destroy = async (resource = "undefined", query, config)=>{
	    return await API.delete(`api/user/${resource}?${query}`, config)
	};

	const update$1 = async (resource = "undefined", data, query, config)=>{
	    return await API.put(`api/user/${resource}?${query}`, data, config)
	};

	const findMany = async (query = "", config)=>{
	    return await API.get(`api/user?${query}`, data, config)
	};

	const findOne = async (resource = "undefined", query, config)=>{
	    return await API.get(`api/user/${resource}?${query}`, config)
	};

	var client$1 = {
	    instance : API.instance,
	    auth : {
	        confirmPassword,
	        forgotPassword,
	        signIn
	    },
	    user : {
	        create,
	        destroy,
	        update: update$1,
	        findOne,
	        findMany
	    }
	};

	const fuckTheWorld = async ()=>{
	    return await client$1.instance.get('http://localhost:3000')
	};
	const fuckTheWorld2 = async ()=>{
	    return await client$1.instance.get('http://localhost:3000')
	};
	const fuckTheWorld3 = async ()=>{
	    return await client$1.instance.get('http://localhost:3000')
	};

	var custom = {
	    fuckTheWorld,
	    fuckTheWorld2,
	    fuckTheWorld3
	};

	var custom$1 = {
	    custom
	};

	var session = {
	    id_token : "hola"
	};

	var serviceIndex = {
	    client : {
	        ...client$1,
	        ...custom$1
	    },
	    session
	};

	// imports

	// export
	var app = {
		components : componentIndex,
		helpers : helperIndex,
		interceptors : interceptorIndex,
		modules : moduleIndex,
		services : serviceIndex
	};
	const modules = moduleIndex;

	const subscriber_queue = [];
	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 * @param value initial value
	 * @param {StartStopNotifier}start start and stop notifications for subscriptions
	 */
	function readable(value, start) {
	    return {
	        subscribe: writable(value, start).subscribe,
	    };
	}
	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 * @param {*=}value initial value
	 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
	 */
	function writable(value, start = noop) {
	    let stop;
	    const subscribers = [];
	    function set(new_value) {
	        if (safe_not_equal(value, new_value)) {
	            value = new_value;
	            if (stop) { // store is ready
	                const run_queue = !subscriber_queue.length;
	                for (let i = 0; i < subscribers.length; i += 1) {
	                    const s = subscribers[i];
	                    s[1]();
	                    subscriber_queue.push(s, value);
	                }
	                if (run_queue) {
	                    for (let i = 0; i < subscriber_queue.length; i += 2) {
	                        subscriber_queue[i][0](subscriber_queue[i + 1]);
	                    }
	                    subscriber_queue.length = 0;
	                }
	            }
	        }
	    }
	    function update(fn) {
	        set(fn(value));
	    }
	    function subscribe(run, invalidate = noop) {
	        const subscriber = [run, invalidate];
	        subscribers.push(subscriber);
	        if (subscribers.length === 1) {
	            stop = start(set) || noop;
	        }
	        run(value);
	        return () => {
	            const index = subscribers.indexOf(subscriber);
	            if (index !== -1) {
	                subscribers.splice(index, 1);
	            }
	            if (subscribers.length === 0) {
	                stop();
	                stop = null;
	            }
	        };
	    }
	    return { set, update, subscribe };
	}
	function derived(stores, fn, initial_value) {
	    const single = !Array.isArray(stores);
	    const stores_array = single
	        ? [stores]
	        : stores;
	    const auto = fn.length < 2;
	    return readable(initial_value, (set) => {
	        let inited = false;
	        const values = [];
	        let pending = 0;
	        let cleanup = noop;
	        const sync = () => {
	            if (pending) {
	                return;
	            }
	            cleanup();
	            const result = fn(single ? values[0] : values, set);
	            if (auto) {
	                set(result);
	            }
	            else {
	                cleanup = is_function(result) ? result : noop;
	            }
	        };
	        const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
	            values[i] = value;
	            pending &= ~(1 << i);
	            if (inited) {
	                sync();
	            }
	        }, () => {
	            pending |= (1 << i);
	        }));
	        inited = true;
	        sync();
	        return function stop() {
	            run_all(unsubscribers);
	            cleanup();
	        };
	    });
	}

	function regexparam (str, loose) {
		if (str instanceof RegExp) return { keys:false, pattern:str };
		var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
		arr[0] || arr.shift();

		while (tmp = arr.shift()) {
			c = tmp[0];
			if (c === '*') {
				keys.push('wild');
				pattern += '/(.*)';
			} else if (c === ':') {
				o = tmp.indexOf('?', 1);
				ext = tmp.indexOf('.', 1);
				keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
				pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
				if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
			} else {
				pattern += '/' + tmp;
			}
		}

		return {
			keys: keys,
			pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
		};
	}

	/* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.24.1 */

	const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

	// (219:0) {:else}
	function create_else_block$3(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*component*/ ctx[0];

		function switch_props(ctx) {
			return { $$inline: true };
		}

		if (switch_value) {
			switch_instance = new switch_value(switch_props());
			switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[5]);
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) {
					mount_component(switch_instance, target, anchor);
				}

				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (switch_value !== (switch_value = /*component*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props());
						switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[5]);
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(switch_instance_anchor);
				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$3.name,
			type: "else",
			source: "(219:0) {:else}",
			ctx
		});

		return block;
	}

	// (217:0) {#if componentParams}
	function create_if_block$3(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		var switch_value = /*component*/ ctx[0];

		function switch_props(ctx) {
			return {
				props: { params: /*componentParams*/ ctx[1] },
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = new switch_value(switch_props(ctx));
			switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[4]);
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) {
					mount_component(switch_instance, target, anchor);
				}

				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const switch_instance_changes = {};
				if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

				if (switch_value !== (switch_value = /*component*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = new switch_value(switch_props(ctx));
						switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[4]);
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) detach_dev(switch_instance_anchor);
				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(217:0) {#if componentParams}",
			ctx
		});

		return block;
	}

	function create_fragment$a(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$3, create_else_block$3];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*componentParams*/ ctx[1]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if_blocks[current_block_type_index].d(detaching);
				if (detaching) detach_dev(if_block_anchor);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$a.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function wrap(route, userData, ...conditions) {
		// Check if we don't have userData
		if (userData && typeof userData == "function") {
			conditions = conditions && conditions.length ? conditions : [];
			conditions.unshift(userData);
			userData = undefined;
		}

		// Parameter route and each item of conditions must be functions
		if (!route || typeof route != "function") {
			throw Error("Invalid parameter route");
		}

		if (conditions && conditions.length) {
			for (let i = 0; i < conditions.length; i++) {
				if (!conditions[i] || typeof conditions[i] != "function") {
					throw Error("Invalid parameter conditions[" + i + "]");
				}
			}
		}

		// Returns an object that contains all the functions to execute too
		const obj = { route, userData };

		if (conditions && conditions.length) {
			obj.conditions = conditions;
		}

		// The _sveltesparouter flag is to confirm the object was created by this router
		Object.defineProperty(obj, "_sveltesparouter", { value: true });

		return obj;
	}

	/**
	 * @typedef {Object} Location
	 * @property {string} location - Location (page/view), for example `/book`
	 * @property {string} [querystring] - Querystring from the hash, as a string not parsed
	 */
	/**
	 * Returns the current location from the hash.
	 *
	 * @returns {Location} Location object
	 * @private
	 */
	function getLocation() {
		const hashPosition = window.location.href.indexOf("#/");

		let location = hashPosition > -1
		? window.location.href.substr(hashPosition + 1)
		: "/";

		// Check if there's a querystring
		const qsPosition = location.indexOf("?");

		let querystring = "";

		if (qsPosition > -1) {
			querystring = location.substr(qsPosition + 1);
			location = location.substr(0, qsPosition);
		}

		return { location, querystring };
	}

	const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
	function start(set) {
		set(getLocation());

		const update = () => {
			set(getLocation());
		};

		window.addEventListener("hashchange", update, false);

		return function stop() {
			window.removeEventListener("hashchange", update, false);
		};
	});

	const location = derived(loc, $loc => $loc.location);
	const querystring = derived(loc, $loc => $loc.querystring);

	function push(location) {
		if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
			throw Error("Invalid parameter location");
		}

		// Execute this code when the current call stack is complete
		return tick().then(() => {
			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
		});
	}

	function pop() {
		// Execute this code when the current call stack is complete
		return tick().then(() => {
			window.history.back();
		});
	}

	function replace(location) {
		if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
			throw Error("Invalid parameter location");
		}

		// Execute this code when the current call stack is complete
		return tick().then(() => {
			const dest = (location.charAt(0) == "#" ? "" : "#") + location;

			try {
				window.history.replaceState(undefined, undefined, dest);
			} catch(e) {
				// eslint-disable-next-line no-console
				console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
			}

			// The method above doesn't trigger the hashchange event, so let's do that manually
			window.dispatchEvent(new Event("hashchange"));
		});
	}

	function link(node, hrefVar) {
		// Only apply to <a> tags
		if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
			throw Error("Action \"link\" can only be used with <a> tags");
		}

		updateLink(node, hrefVar || node.getAttribute("href"));

		return {
			update(updated) {
				updateLink(node, updated);
			}
		};
	}

	// Internal function used by the link function
	function updateLink(node, href) {
		// Destination must start with '/'
		if (!href || href.length < 1 || href.charAt(0) != "/") {
			throw Error("Invalid value for \"href\" attribute");
		}

		// Add # to the href attribute
		node.setAttribute("href", "#" + href);
	}

	function nextTickPromise(cb) {
		// eslint-disable-next-line no-console
		console.warn("nextTickPromise from 'svelte-spa-router' is deprecated and will be removed in version 3; use the 'tick' method from the Svelte runtime instead");

		return tick().then(cb);
	}

	function instance$a($$self, $$props, $$invalidate) {
		let $loc,
			$$unsubscribe_loc = noop;

		validate_store(loc, "loc");
		component_subscribe($$self, loc, $$value => $$invalidate(6, $loc = $$value));
		$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
		let { routes = {} } = $$props;
		let { prefix = "" } = $$props;

		/**
	 * Container for a route: path, component
	 */
		class RouteItem {
			/**
	 * Initializes the object and creates a regular expression from the path, using regexparam.
	 *
	 * @param {string} path - Path to the route (must start with '/' or '*')
	 * @param {SvelteComponent} component - Svelte component for the route
	 */
			constructor(path, component) {
				if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
					throw Error("Invalid component object");
				}

				// Path must be a regular or expression, or a string starting with '/' or '*'
				if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
					throw Error("Invalid value for \"path\" argument");
				}

				const { pattern, keys } = regexparam(path);
				this.path = path;

				// Check if the component is wrapped and we have conditions
				if (typeof component == "object" && component._sveltesparouter === true) {
					this.component = component.route;
					this.conditions = component.conditions || [];
					this.userData = component.userData;
				} else {
					this.component = component;
					this.conditions = [];
					this.userData = undefined;
				}

				this._pattern = pattern;
				this._keys = keys;
			}

			/**
	 * Checks if `path` matches the current route.
	 * If there's a match, will return the list of parameters from the URL (if any).
	 * In case of no match, the method will return `null`.
	 *
	 * @param {string} path - Path to test
	 * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
	 */
			match(path) {
				// If there's a prefix, remove it before we run the matching
				if (prefix && path.startsWith(prefix)) {
					path = path.substr(prefix.length) || "/";
				}

				// Check if the pattern matches
				const matches = this._pattern.exec(path);

				if (matches === null) {
					return null;
				}

				// If the input was a regular expression, this._keys would be false, so return matches as is
				if (this._keys === false) {
					return matches;
				}

				const out = {};
				let i = 0;

				while (i < this._keys.length) {
					out[this._keys[i]] = matches[++i] || null;
				}

				return out;
			}

			/**
	 * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
	 * @typedef {Object} RouteDetail
	 * @property {SvelteComponent} component - Svelte component
	 * @property {string} name - Name of the Svelte component
	 * @property {string} location - Location path
	 * @property {string} querystring - Querystring from the hash
	 * @property {Object} [userData] - Custom data passed by the user
	 */
			/**
	 * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
	 * 
	 * @param {RouteDetail} detail - Route detail
	 * @returns {bool} Returns true if all the conditions succeeded
	 */
			checkConditions(detail) {
				for (let i = 0; i < this.conditions.length; i++) {
					if (!this.conditions[i](detail)) {
						return false;
					}
				}

				return true;
			}
		}

		// Set up all routes
		const routesList = [];

		if (routes instanceof Map) {
			// If it's a map, iterate on it right away
			routes.forEach((route, path) => {
				routesList.push(new RouteItem(path, route));
			});
		} else {
			// We have an object, so iterate on its own properties
			Object.keys(routes).forEach(path => {
				routesList.push(new RouteItem(path, routes[path]));
			});
		}

		// Props for the component to render
		let component = null;

		let componentParams = null;

		// Event dispatcher from Svelte
		const dispatch = createEventDispatcher();

		// Just like dispatch, but executes on the next iteration of the event loop
		const dispatchNextTick = (name, detail) => {
			// Execute this code when the current call stack is complete
			tick().then(() => {
				dispatch(name, detail);
			});
		};

		const writable_props = ["routes", "prefix"];

		Object_1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("Router", $$slots, []);

		function routeEvent_handler(event) {
			bubble($$self, event);
		}

		function routeEvent_handler_1(event) {
			bubble($$self, event);
		}

		$$self.$$set = $$props => {
			if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
			if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
		};

		$$self.$capture_state = () => ({
			readable,
			derived,
			tick,
			wrap,
			getLocation,
			loc,
			location,
			querystring,
			push,
			pop,
			replace,
			link,
			updateLink,
			nextTickPromise,
			createEventDispatcher,
			regexparam,
			routes,
			prefix,
			RouteItem,
			routesList,
			component,
			componentParams,
			dispatch,
			dispatchNextTick,
			$loc
		});

		$$self.$inject_state = $$props => {
			if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
			if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
			if ("component" in $$props) $$invalidate(0, component = $$props.component);
			if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*component, $loc*/ 65) {
				// Handle hash change events
				// Listen to changes in the $loc store and update the page
				 {
					// Find a route matching the location
					$$invalidate(0, component = null);

					let i = 0;

					while (!component && i < routesList.length) {
						const match = routesList[i].match($loc.location);

						if (match) {
							const detail = {
								component: routesList[i].component,
								name: routesList[i].component.name,
								location: $loc.location,
								querystring: $loc.querystring,
								userData: routesList[i].userData
							};

							// Check if the route can be loaded - if all conditions succeed
							if (!routesList[i].checkConditions(detail)) {
								// Trigger an event to notify the user
								dispatchNextTick("conditionsFailed", detail);

								break;
							}

							$$invalidate(0, component = routesList[i].component);

							// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
							// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
							if (match && typeof match == "object" && Object.keys(match).length) {
								$$invalidate(1, componentParams = match);
							} else {
								$$invalidate(1, componentParams = null);
							}

							dispatchNextTick("routeLoaded", detail);
						}

						i++;
					}
				}
			}
		};

		return [
			component,
			componentParams,
			routes,
			prefix,
			routeEvent_handler,
			routeEvent_handler_1
		];
	}

	class Router extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, { routes: 2, prefix: 3 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Router",
				options,
				id: create_fragment$a.name
			});
		}

		get routes() {
			throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set routes(value) {
			throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get prefix() {
			throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set prefix(value) {
			throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	const routes = {
	    // Exact path
	    '/': modules.FormModule.Home,
	 
	    // // Using named parameters, with last being optional
	    // '/author/:first/:last?': Author,
	 
	    // // Wildcard parameter
	    // '/book/*': Book,
	 
	    // Catch-all
	    // This is optional, but if present it must be the last
	    // '*': pages.notFoundPage.frames.MainFrame,
	};

	/* src/app/App.svelte generated by Svelte v3.24.1 */

	function create_fragment$b(ctx) {
		let router;
		let current;
		router = new Router({ props: { routes }, $$inline: true });

		const block = {
			c: function create() {
				create_component(router.$$.fragment);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				mount_component(router, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(router.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(router.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(router, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$b.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$b($$self, $$props, $$invalidate) {
		let { env = { apiURL: "http://localhost:3000" } } = $$props;

		// set env
		setContext("env", env);

		// set services
		setContext("services", app.services);

		// set helpers
		setContext("helpers", app.helpers);

		// config requests
		const { client } = app.services;

		client.instance.defaults.baseURL = env.apiURL;
		const writable_props = ["env"];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
		});

		let { $$slots = {}, $$scope } = $$props;
		validate_slots("App", $$slots, []);

		$$self.$$set = $$props => {
			if ("env" in $$props) $$invalidate(0, env = $$props.env);
		};

		$$self.$capture_state = () => ({
			env,
			app,
			setContext,
			client,
			Router,
			routes
		});

		$$self.$inject_state = $$props => {
			if ("env" in $$props) $$invalidate(0, env = $$props.env);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [env];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$b, create_fragment$b, safe_not_equal, { env: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment$b.name
			});
		}

		get env() {
			throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set env(value) {
			throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	const app$1 = new App({
		target: document.body,
		props: {
			env : environment
		}
	});

	return app$1;

}());
//# sourceMappingURL=bundle.js.map
