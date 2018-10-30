/**
 * Module that defines everything related to building Candlesticks.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Column, IColumnProperties, IColumnAdapters, IColumnEvents } from "./Column";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { Line } from "../../core/elements/Line";
import { registry } from "../../core/Registry";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Candlestick]].
 */
export interface ICandlestickProperties extends IColumnProperties { }

/**
 * Defines events for [[Candlestick]].
 */
export interface ICandlestickEvents extends IColumnEvents { }

/**
 * Defines adapters for [[Candlestick]].
 *
 * @see {@link Adapter}
 */
export interface ICandlestickAdapters extends IColumnAdapters, ICandlestickProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Class used to creates Candlesticks.
 *
 * @see {@link ICandlestickEvents} for a list of available events
 * @see {@link ICandlestickAdapters} for a list of available Adapters
 * @todo Usage example
 * @important
 */
export class Candlestick extends Column {

	/**
	 * Defines available properties.
	 *
	 * @type {ICandlestickProperties}
	 */
	public _properties!: ICandlestickProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {ICandlestickAdapters}
	 */
	public _adapter!: ICandlestickAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {ICandlestickEvents}
	 */
	public _events!: ICandlestickEvents;

	/**
	 * Low line element
	 * @type {Line}
	 */
	public lowLine: Line;

	/**
	 * High line element
	 * @type {Line}
	 */
	public highLine: Line;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "Candlestick";
		this.layout = "none";
	}

	createAssets() {
		super.createAssets();

		this.lowLine = this.createChild(Line);
		this.lowLine.shouldClone = false;

		this.highLine = this.createChild(Line);
		this.highLine.shouldClone = false;
	}

	copyFrom(source: this) {
		super.copyFrom(source)
		if (this.lowLine) {
			this.lowLine.copyFrom(source.lowLine);
		}
		if (this.highLine) {
			this.highLine.copyFrom(source.highLine);
		}
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Candlestick"] = Candlestick;
