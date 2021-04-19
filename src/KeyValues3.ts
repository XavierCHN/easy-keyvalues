import { KeyValues3Comments } from './Comments';

export interface IKV3Value {
    Comments: KeyValues3Comments;
    GetValue(): any;
    GetOwner(): KeyValues3 | undefined;
    SetOwner(owner: KeyValues3 | undefined): void;
    IsBoolean(): this is ValueBoolean;
    IsInt(): this is ValueInt;
    IsDouble(): this is ValueDouble;
    IsString(): this is ValueString;
    IsResource(): this is ValueResource;
    IsDeferredResource(): this is ValueDeferredResource;
    IsArray(): this is ValueArray;
    IsObject(): this is ValueObject;
    Format(): string;
}

export class KV3BaseValue implements IKV3Value {
    protected value: any;
    protected owner?: KeyValues3;
    public Comments = new KeyValues3Comments();

    constructor(owner?: KeyValues3) {
        this.owner = owner;
    }

    public GetValue() {
        return this.value;
    }

    public GetOwner() {
        return this.owner;
    }

    SetOwner(owner: KeyValues3 | undefined): void {
        this.owner = owner;
    }

    public IsBoolean(): this is ValueBoolean {
        return this instanceof ValueBoolean;
    }
    public IsInt(): this is ValueInt {
        return this instanceof ValueInt;
    }
    public IsDouble(): this is ValueDouble {
        return this instanceof ValueDouble;
    }
    public IsString(): this is ValueString {
        return this instanceof ValueString;
    }
    public IsResource(): this is ValueResource {
        return this instanceof ValueResource;
    }
    public IsDeferredResource(): this is ValueDeferredResource {
        return this instanceof ValueDeferredResource;
    }
    public IsArray(): this is ValueArray {
        return this instanceof ValueArray;
    }
    public IsObject(): this is ValueObject {
        return this instanceof ValueObject;
    }

    public Format(): string {
        return String(this.value);
    }
}

/**
 * String
 */
class ValueString extends KV3BaseValue {
    protected value: string = '';

    constructor(initValue?: string) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: string) {
        this.value = String(v);
        return this;
    }

    public Format(): string {
        if (this.value.includes('\n')) {
            return `"""${this.value}"""`;
        }
        return `"${this.value}"`;
    }
}

/**
 * Boolean
 */
class ValueBoolean extends KV3BaseValue {
    protected value: boolean = false;

    constructor(initValue?: boolean) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: boolean) {
        this.value = v === true;
        return this;
    }
}

/**
 * Int
 */
class ValueInt extends KV3BaseValue {
    protected value: number = 0;

    constructor(initValue?: number) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: number) {
        this.value = Math.floor(v);
        return this;
    }
}

/**
 * Double
 */
class ValueDouble extends KV3BaseValue {
    protected value: number = 0;

    constructor(initValue?: number) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: number) {
        this.value = v;
        return this;
    }

    public Format(): string {
        return this.value.toFixed(6);
    }
}

/**
 * resource:""
 */
class ValueResource extends KV3BaseValue {
    protected value: string = '';

    constructor(initValue?: string) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: string) {
        this.value = v;
        return this;
    }

    public Format(): string {
        return `resource:"${this.value}"`;
    }
}

/**
 * deferred_resource:""
 */
class ValueDeferredResource extends KV3BaseValue {
    protected value: string = '';

    constructor(initValue?: string) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue() {
        return this.value;
    }

    public SetValue(v: string) {
        this.value = v;
        return this;
    }

    public Format(): string {
        return `deferred_resource:"${this.value}"`;
    }
}

/**
 * Array
 */
class ValueArray extends KV3BaseValue {
    protected value: IKV3Value[] = [];

    constructor(initValue?: IKV3Value[]) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue(): Readonly<IKV3Value[]> {
        return this.value;
    }

    public SetValue(list: IKV3Value[]) {
        this.value = list.map((v) => v);
        return this;
    }

    public Append(v: IKV3Value) {
        this.value.push(v);
        return this;
    }

    public Insert(v: IKV3Value, index: number) {
        this.value.splice(index, 0, v);
        return this;
    }

    public Delete(v: IKV3Value) {
        const i = this.value.indexOf(v);
        if (i >= 0) {
            this.value.splice(i, 1);
        }
        return this;
    }

    public Format(tab: string = ''): string {
        let text = '';
        let oneLine = true;

        if (
            this.value.some(
                (v) =>
                    v.IsArray() ||
                    v.IsObject() ||
                    v.Comments.HasComments() ||
                    v.Comments.HasEndOfLineComment()
            )
        ) {
            oneLine = false;
        } else {
            const max = this.value.reduce((pv, v) => pv + v.Format().length, 0);
            if (max > 64) {
                oneLine = false;
            }
        }

        if (oneLine) {
            text = ` [ `;
            text += this.value
                .map((v) => {
                    return v.Format();
                })
                .join(', ');
            text += ` ]`;
        } else {
            text = `\n${tab}[`;
            text += this.value
                .map((v) => {
                    let comment = '';
                    let endComment = '';
                    if (v.Comments.HasComments()) {
                        comment = '\n' + v.Comments.Format(tab + '    ').trimEnd();
                    }
                    if (v.Comments.HasEndOfLineComment()) {
                        endComment = ` // ${v.Comments.GetEndOfLineComment()}`;
                    }
                    if (v.IsArray()) {
                        let str = v.Format(tab + '    ');
                        if (!str.startsWith('\n')) {
                            str = '\n' + tab + '   ' + str;
                        }
                        return comment + str + ',' + endComment;
                    } else if (v.IsObject()) {
                        return comment + v.Format(tab + '    ') + ',' + endComment;
                    }
                    return comment + '\n' + tab + '    ' + v.Format() + ',' + endComment;
                })
                .join('');
            text += `\n${tab}]`;
        }

        return text;
    }
}

/**
 * Object
 */
class ValueObject extends KV3BaseValue {
    protected value: KeyValues3[] = [];

    constructor(initValue?: KeyValues3[]) {
        super();
        if (initValue) {
            this.SetValue(initValue);
        }
    }

    public GetValue(): Readonly<KeyValues3[]> {
        return this.value;
    }

    public SetValue(list: KeyValues3[]) {
        this.value = [...list];
        return this;
    }

    public Create(key: string, value: IKV3Value) {
        const kv = new KeyValues3(key, value);
        this.Append(kv);
        return kv;
    }

    public Append(v: KeyValues3) {
        this.value.push(v);
        return this;
    }

    public Insert(v: KeyValues3, index: number) {
        this.value.splice(index, 0, v);
        return this;
    }

    public Delete(v: string | KeyValues3) {
        let kv: KeyValues3 | undefined;
        if (typeof v === 'string') {
            kv = this.value.find((c) => c.Key === v);
        } else {
            kv = this.value.find((c) => c === v);
        }
        if (kv) {
            this.value.splice(this.value.indexOf(kv), 1);
        }
        return kv;
    }

    /**
     * Find a KeyValues3
     */
    public Find(
        callback: (kv: KeyValues3, i: number, parent: ValueObject) => boolean
    ): KeyValues3 | undefined {
        for (const [i, kv] of this.value.entries()) {
            if (callback(kv, i, this) === true) {
                return kv;
            }
        }
    }

    /**
     * Find a KeyValues3
     */
    public FindKey(key: string): KeyValues3 | undefined {
        return this.Find((kv) => kv.Key === key);
    }

    /**
     * Find a KeyValues3
     */
    public FindAll(
        callback: (kv: KeyValues3, i: number, parent: ValueObject) => boolean
    ): KeyValues3[] {
        const result: KeyValues3[] = [];
        for (const [i, kv] of this.value.entries()) {
            if (callback(kv, i, this) === true) {
                result.push(kv);
            }
        }
        return result;
    }

    /**
     * Find a KeyValues3
     */
    public FindAllKeys(...keys: string[]): KeyValues3[] {
        return this.FindAll((kv) => keys.includes(kv.Key));
    }

    public Format(tab: string = ''): string {
        let text = `\n${tab}{`;
        text += this.value.map((v) => '\n' + v.Format(tab + '    ')).join('');
        text += `\n${tab}}`;
        return text;
    }
}

const MatchKeyNoQuote = /^[\w\d_\.]+$/;
const MatchInt = /^-?\d+$/;
const MatchDouble = /^-?\d+(\.\d+)?$/;
const MatchDouble2 = /^-?\.\d+$/;
const MatchDouble3 = /^-?\d+\.$/;
const MatchStrangeNumber = /^[\d\+-\.]+$/;
const MatchBoolean = /^(true|false)$/;
const MatchResource = /^resource:"(.*)"$/;
const MatchDeferredResource = /^deferred_resource:"(.*)"$/;

/**
 * https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3
 */
export default class KeyValues3 {
    public static String = ValueString;
    public static Boolean = ValueBoolean;
    public static Int = ValueInt;
    public static Double = ValueDouble;
    public static Resource = ValueResource;
    public static DeferredResource = ValueDeferredResource;
    public static Array = ValueArray;
    public static Object = ValueObject;

    protected value: IKV3Value;

    protected header?: string;

    constructor(public Key: string, defaultValue: IKV3Value) {
        this.value = defaultValue;
        this.value.SetOwner(this);
    }

    public IsRoot() {
        return !!this.header;
    }

    public GetHeader() {
        return this.header;
    }

    public static CreateRoot() {
        const kv = new KeyValues3('', new ValueObject());
        kv.header = this.CommonHeader;
        return kv;
    }

    public static CommonHeader =
        '<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->';

    public GetValue() {
        return this.value;
    }

    public SetValue(v: IKV3Value) {
        if (this.IsRoot() && !v.IsObject()) {
            throw Error('The root node of KeyValues3 must be an object');
        }
        this.value = v;
    }

    public CreateObjectValue(key: string, value: IKV3Value) {
        if (!this.value.IsObject()) {
            throw Error('The KeyValues3 is not an object');
        }
        return this.value.Create(key, value);
    }

    public AppendValue(value: IKV3Value) {
        if (!this.value.IsArray()) {
            throw Error('The KeyValues3 is not an array');
        }
        return this.value.Append(value);
    }

    public Find(
        callback: (kv: KeyValues3, i: number, parent: ValueObject) => boolean
    ): KeyValues3 | undefined {
        if (!this.value.IsObject()) {
            throw Error('The KeyValues3 is not an object');
        }
        return this.value.Find(callback);
    }

    public FindKey(key: string): KeyValues3 | undefined {
        return this.Find((kv) => kv.Key === key);
    }

    public FindAll(
        callback: (kv: KeyValues3, i: number, parent: ValueObject) => boolean
    ): KeyValues3[] {
        if (!this.value.IsObject()) {
            throw Error('The KeyValues3 is not an object');
        }
        return this.value.FindAll(callback);
    }

    public FindAllKeys(...keys: string[]): KeyValues3[] {
        return this.FindAll((kv) => keys.includes(kv.Key));
    }

    public Format(tab: string = ''): string {
        let text = '';
        let prefix = '';
        const root = this.IsRoot();

        if (MatchKeyNoQuote.test(this.Key)) {
            prefix = `${tab}${this.Key} =`;
        } else {
            prefix = `${tab}"${this.Key}" =`;
        }

        if (root) {
            text += this.header;
        }

        if (this.value.Comments.HasComments()) {
            text += this.value.Comments.Format(tab);
        }

        if (this.value.IsArray()) {
            text += prefix;
            text += this.value.Format(tab);
        } else if (this.value.IsObject()) {
            if (root) {
                text += this.value.Format(tab);
            } else {
                text += prefix;
                text += this.value.Format(tab);
            }
        } else {
            text += prefix + ` ${this.value.Format()}`;
        }

        if (this.value.Comments.HasEndOfLineComment()) {
            text += ` // ${this.value.Comments.GetEndOfLineComment()}`;
        }

        return text;
    }

    public toString() {
        return this.Format();
    }

    public static Parse(body: string): KeyValues3 {
        let root = this.CreateRoot();
        const firstLineIndex = body.indexOf('\n');
        const header = body.slice(0, firstLineIndex).trim();
        if (!header.startsWith('<!--') || !header.endsWith('-->')) {
            throw Error('Invalid header');
        }
        this._parse(root, {
            body,
            line: 2,
            pos: body.indexOf('{', firstLineIndex) + 1,
            tokenCounter: 1,
        });
        return root;
    }

    protected static _parse(
        parent: KeyValues3,
        data: { body: string; line: number; pos: number; tokenCounter: number }
    ) {
        if (parent.value.IsObject()) {
            let isKey = true;
            let startMark = false;
            let inQoute = false;
            let key = '';
            let str = '';
            let isEndOfLineComment = false;
            let commentCache: string[] = [];
            let lastKV: KeyValues3 | undefined;
            for (; data.pos < data.body.length; data.pos++) {
                const c = data.body[data.pos];
                const isNewLine = c === '\n';
                const isSpace = isNewLine || c === ' ' || c === '\t' || c === '\r';

                if (isNewLine) {
                    data.line += 1;
                    isEndOfLineComment = false;
                }

                if (startMark) {
                    if (isKey) {
                        // isKey
                        if (inQoute) {
                            if (c === '\\') {
                                str += c + data.body[data.pos + 1];
                                data.pos += 1;
                                continue;
                            }
                            if (c === '"') {
                                key = str;
                                str = '';
                                startMark = false;
                                continue;
                            } else {
                                str += c;
                                continue;
                            }
                        } else {
                            if (isSpace || c === '=') {
                                key = str;
                                str = '';
                                startMark = false;
                                if (c === '=') {
                                    data.pos -= 1;
                                }
                                continue;
                            }
                            str += c;
                            continue;
                        }
                        // isKey
                    } else {
                        // not isKey
                        if (inQoute) {
                            if (c === '\\') {
                                str += c + data.body[data.pos + 1];
                                data.pos += 1;
                                continue;
                            }
                            if (c === '"') {
                                if (str.length <= 0) {
                                    // check start on multi-line
                                    if (data.body[data.pos + 1] === '"') {
                                        if (
                                            data.body[data.pos + 2] !== '\n' &&
                                            data.body[data.pos + 2] !== '\r'
                                        ) {
                                            throw new Error(
                                                this._parse_error(
                                                    data.line,
                                                    `multi-line start identifier """ must be followed by newline`
                                                )
                                            );
                                        }
                                        data.pos += 1;
                                        continue;
                                    }
                                } else {
                                    // check end on multi-line
                                    if (data.body[data.pos + 1] === '"') {
                                        if (data.body[data.pos + 2] === '"') {
                                            if (data.body[data.pos - 1] !== '\n') {
                                                throw new Error(
                                                    this._parse_error(
                                                        data.line,
                                                        `multi-line end identifier """ must be at the beginning of line`
                                                    )
                                                );
                                            }
                                            data.pos += 2;
                                        } else {
                                            throw new Error(
                                                this._parse_error(
                                                    data.line,
                                                    `multi-line string must be end with """`
                                                )
                                            );
                                        }
                                    }
                                }
                                lastKV = parent.CreateObjectValue(key, new ValueString(str));
                                lastKV.value.Comments.SetComments(commentCache);
                                commentCache = [];
                                key = '';
                                str = '';
                                isKey = true;
                                inQoute = false;
                                startMark = false;
                                continue;
                            } else {
                                str += c;
                                continue;
                            }
                        } else {
                            if (isSpace || c === ']' || c === '}') {
                                if (MatchBoolean.test(str)) {
                                    lastKV = parent.CreateObjectValue(
                                        key,
                                        new ValueBoolean(str === 'true')
                                    );
                                } else if (MatchInt.test(str)) {
                                    lastKV = parent.CreateObjectValue(
                                        key,
                                        new ValueInt(parseInt(str))
                                    );
                                } else if (
                                    MatchDouble.test(str) ||
                                    MatchDouble2.test(str) ||
                                    MatchDouble3.test(str)
                                ) {
                                    lastKV = parent.CreateObjectValue(
                                        key,
                                        new ValueDouble(Number(str))
                                    );
                                } else if (MatchResource.test(str)) {
                                    const m = MatchResource.exec(str) as RegExpExecArray;
                                    let v = m[1] || '';
                                    lastKV = parent.CreateObjectValue(key, new ValueResource(v));
                                } else if (MatchDeferredResource.test(str)) {
                                    const m = MatchDeferredResource.exec(str) as RegExpExecArray;
                                    let v = m[1] || '';
                                    lastKV = parent.CreateObjectValue(
                                        key,
                                        new ValueDeferredResource(v)
                                    );
                                } else if (MatchStrangeNumber.test(str)) {
                                    lastKV = parent.CreateObjectValue(key, new ValueString(str));
                                } else {
                                    throw new Error(
                                        this._parse_error(data.line, `Invalid value '${str}'`)
                                    );
                                }
                                lastKV.value.Comments.SetComments(commentCache);
                                commentCache = [];
                                key = '';
                                str = '';
                                isKey = true;
                                inQoute = false;
                                startMark = false;
                                if (c === ']' || c === '}') {
                                    data.pos -= 1;
                                }
                                continue;
                            }
                            str += c;
                            continue;
                        }
                        // not isKey
                    }
                }

                if (c === '/') {
                    if (data.body[data.pos + 1] === '/') {
                        const nextIndex = data.body.indexOf('\n', data.pos + 2);
                        if (isEndOfLineComment && lastKV) {
                            lastKV.value.Comments.SetEndOfLineComment(
                                data.body.slice(data.pos + 2, nextIndex).trimStart()
                            );
                            isEndOfLineComment = false;
                        } else {
                            commentCache.push(data.body.slice(data.pos + 2, nextIndex).trimStart());
                        }
                        data.pos = nextIndex;
                        data.line += 1;
                        continue;
                    } else if (data.body[data.pos + 1] === '*') {
                        const nextIndex = data.body.indexOf('*/', data.pos + 2);
                        const comment = data.body.slice(data.pos + 2, nextIndex).trim();
                        if (comment.includes('\n')) {
                            commentCache.push(comment);
                        } else {
                            if (isEndOfLineComment && lastKV) {
                                lastKV.value.Comments.SetEndOfLineComment(comment);
                                isEndOfLineComment = false;
                            } else {
                                commentCache.push(comment);
                            }
                        }
                        data.line += data.body.slice(data.pos, nextIndex).match(/\n/g)?.length || 1;
                        data.pos = nextIndex + 1;
                        continue;
                    }
                }

                if (c === '{') {
                    if (isKey) {
                        throw new Error(this._parse_error(data.line, `Invalid char '{'`));
                    }
                    const child = parent.CreateObjectValue(key, new ValueObject());
                    data.pos += 1;
                    data.tokenCounter += 1;
                    this._parse(child, data);
                    key = '';
                    str = '';
                    isKey = true;
                    inQoute = false;
                    startMark = false;
                    continue;
                }

                if (c === '[') {
                    if (isKey) {
                        throw new Error(this._parse_error(data.line, `Invalid char '['`));
                    }
                    const child = parent.CreateObjectValue(key, new ValueArray());
                    data.pos += 1;
                    data.tokenCounter += 1;
                    this._parse(child, data);
                    key = '';
                    str = '';
                    isKey = true;
                    inQoute = false;
                    startMark = false;
                    continue;
                }

                if (c === '}' || c === ']') {
                    data.tokenCounter += 1;
                    return;
                }

                if (isSpace) {
                    continue;
                }

                if (c === '=') {
                    if (key === '' && !inQoute) {
                        throw new Error(this._parse_error(data.line, `Invalid member name '='`));
                    }
                    if (!inQoute && !MatchKeyNoQuote.test(key)) {
                        throw new Error(
                            this._parse_error(data.line, `Invalid member name '${key}'`)
                        );
                    }
                    isKey = false;
                    inQoute = false;
                    continue;
                }

                startMark = true;
                inQoute = c === '"';
                str = inQoute ? '' : c;
                isEndOfLineComment = true;
            }
        } else if (parent.value.IsArray()) {
            let startMark = false;
            let inQoute = false;
            let str = '';
            let expectedEnd = false;
            let isEndOfLineComment = false;
            let commentCache: string[] = [];
            let lastValue: IKV3Value | undefined;
            for (; data.pos < data.body.length; data.pos++) {
                const c = data.body[data.pos];
                const isNewLine = c === '\n';
                const isSpace = isNewLine || c === ' ' || c === '\t' || c === '\r';

                if (isNewLine) {
                    data.line += 1;
                    isEndOfLineComment = false;
                }

                if (startMark) {
                    if (inQoute) {
                        if (c === '\\') {
                            str += c + data.body[data.pos + 1];
                            data.pos += 1;
                            continue;
                        }
                        if (c === '"') {
                            if (str.length <= 0) {
                                // check start on multi-line
                                if (data.body[data.pos + 1] === '"') {
                                    if (
                                        data.body[data.pos + 2] !== '\n' &&
                                        data.body[data.pos + 2] !== '\r'
                                    ) {
                                        throw new Error(
                                            this._parse_error(
                                                data.line,
                                                `multi-line start identifier """ must be followed by newline`
                                            )
                                        );
                                    }
                                    data.pos += 1;
                                    continue;
                                }
                            } else {
                                // check end on multi-line
                                if (data.body[data.pos + 1] === '"') {
                                    if (data.body[data.pos + 2] === '"') {
                                        if (data.body[data.pos - 1] !== '\n') {
                                            throw new Error(
                                                this._parse_error(
                                                    data.line,
                                                    `multi-line end identifier """ must be at the beginning of line`
                                                )
                                            );
                                        }
                                        data.pos += 2;
                                    } else {
                                        throw new Error(
                                            this._parse_error(
                                                data.line,
                                                `multi-line string must be end with """`
                                            )
                                        );
                                    }
                                }
                            }
                            lastValue = new ValueString(str);
                            parent.AppendValue(lastValue);
                            lastValue.Comments.SetComments(commentCache);
                            commentCache = [];
                            str = '';
                            inQoute = false;
                            startMark = false;
                            expectedEnd = true;
                            continue;
                        } else {
                            str += c;
                            continue;
                        }
                    } else {
                        if (isSpace || c === ',' || c === ']') {
                            if (MatchBoolean.test(str)) {
                                lastValue = new ValueBoolean(str === 'true');
                                parent.AppendValue(lastValue);
                            } else if (MatchInt.test(str)) {
                                lastValue = new ValueInt(parseInt(str));
                                parent.AppendValue(lastValue);
                            } else if (
                                MatchDouble.test(str) ||
                                MatchDouble2.test(str) ||
                                MatchDouble3.test(str)
                            ) {
                                lastValue = new ValueDouble(Number(str));
                                parent.AppendValue(lastValue);
                            } else if (MatchResource.test(str)) {
                                const m = MatchResource.exec(str) as RegExpExecArray;
                                let v = m[1] || '';
                                lastValue = new ValueResource(v);
                                parent.AppendValue(lastValue);
                            } else if (MatchDeferredResource.test(str)) {
                                const m = MatchDeferredResource.exec(str) as RegExpExecArray;
                                let v = m[1] || '';
                                lastValue = new ValueDeferredResource(v);
                                parent.AppendValue(lastValue);
                            } else if (MatchStrangeNumber.test(str)) {
                                lastValue = new ValueString(str);
                                parent.AppendValue(lastValue);
                            } else {
                                throw new Error(
                                    this._parse_error(data.line, `Invalid value '${str}'`)
                                );
                            }
                            lastValue.Comments.SetComments(commentCache);
                            commentCache = [];
                            str = '';
                            inQoute = false;
                            startMark = false;
                            expectedEnd = c !== ',' && c !== ']';
                            if (c === ']') {
                                data.pos -= 1;
                            }
                            continue;
                        }
                        str += c;
                        continue;
                    }
                }

                if (c === '/') {
                    if (data.body[data.pos + 1] === '/') {
                        const nextIndex = data.body.indexOf('\n', data.pos + 2);
                        if (isEndOfLineComment && lastValue) {
                            lastValue.Comments.SetEndOfLineComment(
                                data.body.slice(data.pos + 2, nextIndex).trimStart()
                            );
                            isEndOfLineComment = false;
                        } else {
                            commentCache.push(data.body.slice(data.pos + 2, nextIndex).trimStart());
                        }
                        data.pos = nextIndex;
                        data.line += 1;
                        continue;
                    } else if (data.body[data.pos + 1] === '*') {
                        const nextIndex = data.body.indexOf('*/', data.pos + 2);
                        const comment = data.body.slice(data.pos + 2, nextIndex).trim();
                        if (comment.includes('\n')) {
                            commentCache.push(comment);
                        } else {
                            if (isEndOfLineComment && lastValue) {
                                lastValue.Comments.SetEndOfLineComment(comment);
                                isEndOfLineComment = false;
                            } else {
                                commentCache.push(comment);
                            }
                        }
                        data.line += data.body.slice(data.pos, nextIndex).match(/\n/g)?.length || 1;
                        data.pos = nextIndex + 1;
                        continue;
                    }
                }

                if (expectedEnd) {
                    if (isSpace) {
                        continue;
                    }
                    if (c !== ',' && c !== ']') {
                        throw new Error(this._parse_error(data.line, `Expected ',' or ']'`));
                    }
                    expectedEnd = false;
                }
                if (c === ',') {
                    continue;
                }

                if (c === '{') {
                    const child = new KeyValues3('', new ValueObject());
                    data.pos += 1;
                    data.tokenCounter += 1;
                    this._parse(child, data);
                    child.value.SetOwner(parent);
                    parent.value.Append(child.value);
                    str = '';
                    inQoute = false;
                    startMark = false;
                    continue;
                }

                if (c === '[') {
                    const child = new KeyValues3('', new ValueArray());
                    data.pos += 1;
                    data.tokenCounter += 1;
                    this._parse(child, data);
                    child.value.SetOwner(parent);
                    parent.value.Append(child.value);
                    str = '';
                    inQoute = false;
                    startMark = false;
                    continue;
                }

                if (c === '}' || c === ']') {
                    data.tokenCounter += 1;
                    return;
                }

                if (isSpace) {
                    continue;
                }

                startMark = true;
                inQoute = c === '"';
                str = inQoute ? '' : c;
                isEndOfLineComment = true;
            }
        } else {
            throw Error("Parent's value must be an object or array");
        }
    }

    protected static _parse_error(line: number, msg: string) {
        return `not readable as KeyValues3 text: Line ${line}: ${msg}`;
    }
}
