/**
 * Map spline series module
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { MapLineSeries, MapLineSeriesDataItem, IMapLineSeriesProperties, IMapLineSeriesDataFields, IMapLineSeriesAdapters, IMapLineSeriesEvents } from "./MapLineSeries";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { MapChart, MapLineType } from "../types/MapChart";
import { MapSpline } from "./MapSpline";
import { ListTemplate, IListEvents } from "../../core/utils/List";
import { IMapDataObject, IMapPolygonDataObject, IMapLineDataObject } from "../types/MapChart";
import { registry } from "../../core/Registry";
import { IDisposer, Disposer, MultiDisposer } from "../../core/utils/Disposer";

/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

/**
 * Defines a [[DataItem]] for [[MapSplineSeries]]
 * @see {@link DataItem}
 */
export class MapSplineSeriesDataItem extends MapLineSeriesDataItem {

	/**
	 * A [[MapSpline]] element related to this data item.
	 *
	 * @type {MapSpline}
	 */
	public _mapLine: MapSpline;

	/**
	 * Defines a type of [[Component]] this data item is used for
	 * @type {Component}
	 */
	public _component!: MapSplineSeries;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "MapSplineSeriesDataItem";
		this.applyTheme();
	}

}


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines data fields for [[MapSplineSeries]].
 */
export interface IMapSplineSeriesDataFields extends IMapLineSeriesDataFields { }

/**
 * Defines properties for [[MapSplineSeries]].
 */
export interface IMapSplineSeriesProperties extends IMapLineSeriesProperties { }

/**
 * Defines events for [[MapSplineSeries]].
 */
export interface IMapSplineSeriesEvents extends IMapLineSeriesEvents { }

/**
 * Defines adapters for [[MapSplineSeries]].
 *
 * @see {@link Adapter}
 */
export interface IMapSplineSeriesAdapters extends IMapLineSeriesAdapters, IMapSplineSeriesProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * A series of map spline elements.
 *
 * @see {@link IMapSplineSeriesEvents} for a list of available Events
 * @see {@link IMapSplineSeriesAdapters} for a list of available Adapters
 * @important
 */
export class MapSplineSeries extends MapLineSeries {

	/**
	 * Defines available data fields.
	 *
	 * @type {IMapSplineSeriesDataFields}
	 */
	public _dataFields: IMapSplineSeriesDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {IMapSplineSeriesProperties}
	 */
	public _properties!: IMapSplineSeriesProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IMapSplineSeriesAdapters}
	 */
	public _adapter!: IMapSplineSeriesAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IMapSplineSeriesEvents}
	 */
	public _events!: IMapSplineSeriesEvents;

	/**
	 * Defines the type of data item.
	 *
	 * @type {MapSplineSeriesDataItem}
	 */
	public _dataItem: MapSplineSeriesDataItem;

	/**
	 * Defines the type of the line items in this series.
	 *
	 * @type {MapSpline}
	 */
	public _mapLine: MapSpline;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "MapSplineSeries";
		this.applyTheme();
	}

	/**
	 * Returns a new/empty DataItem of the type appropriate for this object.
	 *
	 * @see {@link DataItem}
	 * @return {MapSplineSeriesDataItem} Data Item
	 */
	protected createDataItem(): this["_dataItem"] {
		return new MapSplineSeriesDataItem();
	}

	/**
	 * Returns a new line instance of suitable type.
	 *
	 * @return {MapSpline} New line
	 */
	protected createLine(): this["_mapLine"] {
		return new MapSpline();
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["MapSplineSeries"] = MapSplineSeries;
registry.registeredClasses["MapSplineSeriesDataItem"] = MapSplineSeriesDataItem;
