/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { dataLoader } from "./DataLoader";
import { DataParser } from "./DataParser";
import { JSONParser } from "./JSONParser";
import { CSVParser } from "./CSVParser";
import { BaseObjectEvents, IBaseObjectEvents } from "../Base";
import { Component } from "../Component";
import { Adapter } from "../utils/Adapter";
import { EventDispatcher, AMEvent } from "../utils/EventDispatcher";
import { Language } from "../utils/Language";
import { DateFormatter } from "../formatters/DateFormatter";
import { INetRequestOptions } from "../utils/Net";
import { IDisposer } from "../utils/Disposer";
import { registry } from "../Registry";
import * as $type from "../utils/Type";
import * as $object from "../utils/Object";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines events for [[DataSource]].
 */
export interface IDataSourceEvents extends IBaseObjectEvents {

	/**
	 * Invoked when loading of the data starts.
	 */
	started: {};

	/**
	 * Invoked when loading of the data starts.
	 */
	loadstarted: {};

	/**
	 * Invoked when the loading of the data finishes.
	 */
	loadended: {};

	/**
	 * Invoked when parsing of the loaded data starts.
	 */
	parsestarted: {};

	/**
	 * Invoked when parsing of the loaded data finishes.
	 */
	parseended: {};

	/**
	 * Invoked when loading and parsing finishes.
	 */
	ended: {};

	/**
	 * Invoked when data source was successfully loaded and parsed.
	 */
	done: {
		data: any
	};

	/**
	 * Invoked when data source encounters a loading error.
	 */
	error: {
		code: number,
		message: string
	};

	/**
	 * Invoked when data source encounters a parsing error.
	 */
	parseerror: {
		message: string
	};

};

/**
 * Defines adapters for [[DataSource]].
 */
export interface IDataSourceAdapters {

	/**
	 * Applied to a data source URL before it is loaded.
	 *
	 * @type {string}
	 */
	url: string;

	/**
	 * Applied to a parser type, before parsing starts.
	 *
	 * Can be used to supply different parser than the one set/determined by
	 * Data Loader.
	 *
	 * @type {DataParser}
	 */
	parser: DataParser;

	/**
	 * Applied to the timeout setting.
	 *
	 * @type {number}
	 */
	reloadTimeout: number;

	/**
	 * Applied to the loaded data **before** it is passed to parser.
	 *
	 * @type {string}
	 */
	unparsedData: string;

	/**
	 * Applied to the loaded data **after** it was parsed by a parser.
	 * @type {any}
	 */
	parsedData: any;

	/**
	 * Applied to `incremental` setting.
	 *
	 * @type {boolean}
	 */
	incremental: boolean;

	/**
	 * Applied to `incrementalParams` setting.
	 *
	 * @type {string}
	 */
	incrementalParams: { [index: string]: string };

	/**
	 * Applied to `keepCount` setting.
	 *
	 * @type {boolean}
	 */
	keepCount: boolean;

	/**
	 * Applied to parser options.
	 *
	 * @type {any}
	 */
	parserOptions: any;

	/**
	 * Applied to the array that lists fields in data that hold date-based values.
	 *
	 * @type {string[]}
	 */
	dateFields: string[];

	/**
	 * Applied to the array that lists fields in data that hold numeric values.
	 *
	 * @type {string[]}
	 */
	numberFields: string[];

	/**
	 * Applied to the custom request options object.
	 *
	 * @type {INetRequestOptions}
	 */
	requestOptions: INetRequestOptions;

};


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Represents a single data source - external file with all of its settings,
 * such as format, data parsing, etc.
 *
 * ```TypeScript
 * chart.dataSource.url = "http://www.myweb.com/data.json";
 * chart.dataSource.parser = am4core.JSONParser;
 * ```
 * ```JavaScript
 * chart.dataSource.url = "http://www.myweb.com/data.json";
 * chart.dataSource.parser = am4core.JSONParser;
 * ```
 * ```JSON
 * {
 *   // ...
 *   "dataSource": {
 *     "url": "http://www.myweb.com/data.json",
 *     "parser": "JSONParser"
 *   },
 *   // ...
 * }
 * ```
 *
 * @see {@link IDataSourceEvents} for a list of available events
 * @see {@link IDataSourceAdapters} for a list of available Adapters
 */
export class DataSource extends BaseObjectEvents {

	/**
	 * Defines available events.
	 *
	 * @type {IDataSourceEvents}
	 */
	public _events!: IDataSourceEvents;

	/**
	 * Defines available adapters.
	 *
	 * @type {IExportAdapters}
	 */
	public _adapter!: IDataSourceAdapters;

	/**
	 * Adapter.
	 *
	 * @type {Adapter<DataSource, IDataSourceAdapters>}
	 */
	public adapter: Adapter<DataSource, IDataSourceAdapters> = new Adapter<DataSource, IDataSourceAdapters>(this);

	/**
	 * A [[Component]] recipient of the data.
	 *
	 * @type {Component}
	 */
	public component: Component;

	/**
	 * An instance of [[Language]].
	 *
	 * @type {Language}
	 */
	protected _language: Language;

	/**
	 * An instance of [[DateFormatter]].
	 *
	 * @type {DateFormatter}
	 */
	protected _dateFormatter: DateFormatter;

	/**
	 * An instance of parser class that can understand and parse data from the
	 * source URL.
	 *
	 * @type {DataParser}
	 */
	protected _parser: DataParser;

	/**
	 * An URL of the data source.
	 *
	 * @type {string}
	 */
	protected _url: string;

	/**
	 * Custom options for HTTP(S) request.
	 *
	 * @type {INetRequestOptions}
	 */
	protected _requestOptions: INetRequestOptions = {};

	/**
	 * Reload full data source every X ms.
	 *
	 * @type {number}
	 */
	protected _reloadFrequency: number;

	/**
	 * Holds timeout reference for next reload.
	 *
	 * @type {any}
	 */
	protected _reloadTimeout: any;

	/**
	 * Holds disposer for the reload event handler.
	 * 
	 * @type {IDisposer}
	 */
	private _reloadDisposer: IDisposer;

	/**
	 * If set to `true`, any subsequent data loads will be considered incremental
	 * (containing only new data points that are supposed to be added to existing
	 * data).
	 *
	 * NOTE: this setting works only with element's `data` property. It won't
	 * work with any other externally-loadable data property.
	 *
	 * @default false
	 * @type {boolean}
	 */
	protected _incremental: boolean = false;

	/**
	 * A collection of key/value pairs to attach to a data source URL when making
	 * an incremental request.
	 */
	protected _incrementalParams: { [index: string]: string } = {};

	/**
	 * This setting is used only when `incremental = true`. If set to `true`,
	 * it will try to retain the same number of data items across each load.
	 *
	 * E.g. if incremental load yeilded 5 new records, then 5 items from the
	 * beginning of data will be removed so that we end up with the same number
	 * of data items.
	 *
	 * @default false
	 * @type {boolean}
	 */
	protected _keepCount: boolean = false;

	/**
	 * Holds the date of the last load.
	 *
	 * @type {Date}
	 */
	public lastLoad: Date;

	/**
	 * If set to `true` it will timestamp all requested URLs to work around
	 * browser cache.
	 *
	 * @type {boolean}
	 */
	public disableCache: boolean;

	/**
	 * Will show loading indicator when loading files.
	 *
	 * @type {boolean}
	 */
	public showPreloader: boolean = true;

	/**
	 * Loaded and parsed data.
	 *
	 * @type {string}
	 */
	public data: any;

	/**
	 * Constructor
	 */
	constructor(url?: string, parser?: string | DataParser) {

		// Init
		super();
		this.className = "DataSource";

		// Set defaults
		if (url) {
			this.url = url;
		}

		// Set parser
		if (parser) {
			if (typeof parser == "string") {
				this.parser = dataLoader.getParserByType(parser);
			}
			else {
				this.parser = parser;
			}
		}

	}

	/**
	 * Processes the loaded data.
	 *
	 * @ignore Exclude from docs
	 * @param {string}  data  Raw (unparsed) data
	 * @param {string}  type  Content type of the loaded data (optional)
	 */
	public processData(data: string, type?: string): void {
		// Parsing started
		this.dispatchImmediately("parsestarted");

		// Check if parser is set
		if (!this.parser) {

			// Try to resolve from data
			this.parser = dataLoader.getParserByData(data, type);

			if (!this.parser) {
				// We have a problem - nobody knows what to do with the data
				// Raise error
				if (this.events.isEnabled("parseerror")) {
					const event: AMEvent<this, IDataSourceEvents>["parseerror"] = {
						type: "parseerror",
						message: this.language.translate("No parser available for file: %1", null, this.url),
						target: this
					};
					this.events.dispatchImmediately("parseerror", event);
				}
				this.dispatchImmediately("parseended");
				return;
			}

		}

		// Apply options adapters
		this.parser.options = this.adapter.apply("parserOptions", this.parser.options);
		this.parser.options.dateFields = this.adapter.apply("dateFields", this.parser.options.dateFields || []);
		this.parser.options.numberFields = this.adapter.apply("numberFields", this.parser.options.numberFields || []);

		// Check if we need to pass in date formatter
		if (this.parser.options.dateFields && !this.parser.options.dateFormatter) {
			this.parser.options.dateFormatter = this.dateFormatter;
		}

		// Parse
		this.data = this.adapter.apply(
			"parsedData",
			this.parser.parse(
				this.adapter.apply("unparsedData", data)
			)
		);

		// Check for parsing errors
		if (!$type.hasValue(this.data) && this.events.isEnabled("parseerror")) {
			const event: AMEvent<this, IDataSourceEvents>["parseerror"] = {
				type: "parseerror",
				message: this.language.translate("Error parsing file: %1", null, this.url),
				target: this
			};
			this.events.dispatchImmediately("parseerror", event);
		}

		// Wrap up
		this.dispatchImmediately("parseended");

		if ($type.hasValue(this.data)) {
			this.dispatchImmediately("done", {
				"data": this.data
			});
		}

		// The component is responsible for updating its own data vtriggered via
		// events.

		// Update last data load
		this.lastLoad = new Date();

	}

	/**
	 * URL of the data source.
	 *
	 * @param {string}  value  URL
	 */
	public set url(value: string) {
		this._url = value;
	}

	/**
	 * @return {string} URL
	 */
	public get url(): string {

		// Get URL
		let url = this.disableCache
			? this.timestampUrl(this._url)
			: this._url;

		// Add incremental params
		if (this.incremental && this.component.data.length) {
			url = this.addUrlParams(url, this.incrementalParams);
		}

		return this.adapter.apply("url", url);

	}

	/**
	 * Custom options for HTTP(S) request.
	 *
	 * At this moment the only option supported is: `requestHeaders`, which holds
	 * an array of objects for custom request headers, e.g.:
	 *
	 * ```TypeScript
	 * chart.dataSource.requestOptions.requestHeaders = [{
	 *   "key": "x-access-token",
	 *   "value": "123456789"
	 * }];
	 * ``````JavaScript
	 * chart.dataSource.requestOptions.requestHeaders = [{
	 *   "key": "x-access-token",
	 *   "value": "123456789"
	 * }];
	 * ```
	 * ```JSON
	 * {
	 *   // ...
	 *   "dataSource": {
	 *     // ...
	 *     "requestOptions": {
	 *       "requestHeaders": [{
	 *         "key": "x-access-token",
	 *         "value": "123456789"
	 *       }]
	 *     }
	 *   }
	 * }
	 * ```
	 *
	 * NOTE: setting this options on an-already loaded DataSource will not
	 * trigger a reload.
	 *
	 * @param {INetRequestOptions}  value  Options
	 */
	public set requestOptions(value: INetRequestOptions) {
		this._requestOptions = value;
	}

	/**
	 * @return {INetRequestOptions} Options
	 */
	public get requestOptions(): INetRequestOptions {
		return this.adapter.apply("requestOptions", this._requestOptions);
	}

	/**
	 * A parser to be used to parse data.
	 *
	 * ```TypeScript
	 * chart.dataSource.url = "http://www.myweb.com/data.json";
	 * chart.dataSource.parser = am4core.JSONParser;
	 * ```
	 * ```JavaScript
	 * chart.dataSource.url = "http://www.myweb.com/data.json";
	 * chart.dataSource.parser = am4core.JSONParser;
	 * ```
	 * ```JSON
	 * {
	 *   // ...
	 *   "dataSource": {
	 *     "url": "http://www.myweb.com/data.json",
	 *     "parser": "JSONParser"
	 *   },
	 *   // ...
	 * }
	 * ```
	 *
	 * @default JSONParser
	 * @param {DataParser}  value  Data parser
	 */
	public set parser(value: DataParser) {
		this._parser = value;
	}

	/**
	 * @return {DataParser} Data parser
	 */
	public get parser(): DataParser {
		if (!this._parser) {
			this._parser = new JSONParser();
		}
		return this.adapter.apply("parser", this._parser);
	}

	/**
	 * Data source reload frequency.
	 *
	 * If set, it will reload the same URL every X milliseconds.
	 *
	 * @param {number} value Reload frequency (ms)
	 */
	public set reloadFrequency(value: number) {
		if (this._reloadFrequency != value) {
			this._reloadFrequency = value;

			// Should we schedule a reload?
			if (value) {
				if (!$type.hasValue(this._reloadDisposer)) {
					this._reloadDisposer = this.events.on("ended", (ev) => {
						this._reloadTimeout = setTimeout(() => {
							this.load();
						}, this.reloadFrequency);
					});
				}
			}
			else if ($type.hasValue(this._reloadDisposer)) {
				this._reloadDisposer.dispose();
				this._reloadDisposer = undefined;
			}
		}
	}

	/**
	 * @return {number} Reload frequency (ms)
	 */
	public get reloadFrequency(): number {
		return this.adapter.apply("reloadTimeout", this._reloadFrequency);
	}

	/**
	 * Should subsequent reloads be treated as incremental?
	 *
	 * Incremental loads will assume that they contain only new data items
	 * since the last load.
	 *
	 * If `incremental = false` the loader will replace all of the target's
	 * data with each load.
	 *
	 * This setting does not have any effect trhe first time data is loaded.
	 *
	 * NOTE: this setting works only with element's `data` property. It won't
	 * work with any other externally-loadable data property.
	 *
	 * @default false
	 * @param {boolean} Incremental load?
	 */
	public set incremental(value: boolean) {
		this._incremental = value;
	}

	/**
	 * @return {boolean} Incremental load?
	 */
	public get incremental(): boolean {
		return this.adapter.apply("incremental", this._incremental);
	}

	/**
	 * An object consisting of key/value pairs to apply to an URL when data
	 * source is making an incremental request.
	 *
	 * @param {object}  value  Incremental request parameters
	 */
	public set incrementalParams(value: { [index: string]: string }) {
		this._incrementalParams = value;
	}

	/**
	 * @return {object} Incremental request parameters
	 */
	public get incrementalParams(): { [index: string]: string } {
		return this.adapter.apply("incrementalParams", this._incrementalParams);
	}

	/**
	 * This setting is used only when `incremental = true`. If set to `true`,
	 * it will try to retain the same number of data items across each load.
	 *
	 * E.g. if incremental load yeilded 5 new records, then 5 items from the
	 * beginning of data will be removed so that we end up with the same number
	 * of data items.
	 *
	 * @default false
	 * @param {boolean} Keep record count?
	 */
	public set keepCount(value: boolean) {
		this._keepCount = value;
	}

	/**
	 * @return {boolean} keepCount load?
	 */
	public get keepCount(): boolean {
		return this.adapter.apply("keepCount", this._keepCount);
	}

	/**
	 * Language instance to use.
	 *
	 * Will inherit and use chart's language, if not set.
	 *
	 * @param {Language} value An instance of Language
	 */
	public set language(value: Language) {
		this._language = value;
	}

	/**
	 * @return {Language} A [[Language]] instance to be used
	 */
	public get language(): Language {
		if (this._language) {
			return this._language;
		}
		else if (this.component) {
			this._language = this.component.language;
			return this._language;
		}
		this.language = new Language();
		return this.language;
	}

	/**
	 * A [[DateFormatter]] to use when parsing dates from string formats.
	 *
	 * Will inherit and use chart's DateFormatter if not ser.
	 *
	 * @param {DateFormatter} value An instance of [[DateFormatter]]
	 */
	public set dateFormatter(value: DateFormatter) {
		this._dateFormatter = value;
	}

	/**
	 * @return {DateFormatter} A [[DateFormatter]] instance to be used
	 */
	public get dateFormatter(): DateFormatter {
		if (this._dateFormatter) {
			return this._dateFormatter;
		}
		else if (this.component) {
			this._dateFormatter = this.component.dateFormatter;
			return this._dateFormatter;
		}
		this.dateFormatter = new DateFormatter();
		return this.dateFormatter;
	}

	/**
	 * Adds current timestamp to the URL.
	 *
	 * @param  {string}  url  Source URL
	 * @return {string}       Timestamped URL
	 */
	public timestampUrl(url: string): string {
		let tstamp = new Date().getTime().toString();
		let params: { [index: string]: string } = {};
		params[tstamp] = "";
		return this.addUrlParams(url, params);
	}

	/**
	 * Disposes of this object.
	 */
	public dispose(): void {
		super.dispose();
		if (this._reloadTimeout) {
			clearTimeout(this._reloadTimeout);
		}
	}

	/**
	 * Initiate the load.
	 *
	 * All loading in JavaScript is asynchronous. This function will trigger the
	 * load and will exit immediately.
	 *
	 * Use DataSource's events to watch for loaded data and errors.
	 */
	public load(): void {
		if (this._reloadTimeout) {
			clearTimeout(this._reloadTimeout);
		}
		dataLoader.load(this);
	}

	/**
	 * Adds parameters to `url` as query strings. Will take care of proper
	 * separators.
	 * 
	 * @param  {string}  url     Source URL
	 * @param  {object}  params  Parameters
	 * @return {string}          New URL
	 */
	public addUrlParams(url: string, params: { [index: string]: string }): string {
		let join = url.match(/\?/) ? "&" : "?";
		let add: string[] = [];
		$object.each(params, (key, value) => {
			if (value != "") {
				add.push(key + "=" + encodeURIComponent(value));
			}
			else {
				add.push(key);
			}
		});
		if (add.length) {
			return url + join + add.join("&");
		}
		return url;
	}

	/**
	 * Processes JSON-based config before it is applied to the object.
	 *
	 * @ignore Exclude from docs
	 * @param {object}  config  Config
	 */
	public processConfig(config?: { [index: string]: any }): void {

		registry.registeredClasses["json"] = JSONParser;
		registry.registeredClasses["JSONParser"] = JSONParser;
		registry.registeredClasses["csv"] = CSVParser;
		registry.registeredClasses["CSVParser"] = CSVParser;

		super.processConfig(config);

	}

}
