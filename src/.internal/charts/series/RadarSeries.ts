/**
 * Radar series module.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { LineSeries, LineSeriesDataItem, ILineSeriesDataFields, ILineSeriesProperties, ILineSeriesAdapters, ILineSeriesEvents } from "./LineSeries";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { LineSeriesSegment } from "./LineSeriesSegment";
import { IPoint } from "../../core/defs/IPoint";
import { AxisRendererRadial } from "../axes/AxisRendererRadial";
import { Axis } from "../axes/Axis";
import { RadarChart } from "../types/RadarChart";
import { registry } from "../../core/Registry";
import * as $math from "../../core/utils/Math";
import * as $path from "../../core/rendering/Path";


/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

/**
 * Defines a [[DataItem]] for [[RadarSeries]].
 *
 * @see {@link DataItem}
 */
export class RadarSeriesDataItem extends LineSeriesDataItem {

	/**
	 * Defines a type of [[Component]] this data item is used for.
	 *
	 * @type {RadarSeries}
	 */
	public _component!: RadarSeries;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "RadarSeriesDataItem";

		this.setLocation("dateX", 0, 0);
		this.setLocation("dateY", 0, 0);

		this.setLocation("categoryX", 0, 0);
		this.setLocation("categoryY", 0, 0);

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
 * Defines data fields for [[RadarSeries]].
 */
export interface IRadarSeriesDataFields extends ILineSeriesDataFields { }

/**
 * Defines properties for [[RadarSeries]].
 */
export interface IRadarSeriesProperties extends ILineSeriesProperties {

	/**
	 * Should the last and and first data points be connected, forming a complete
	 * closed circle?
	 *
	 * @default true
	 * @type {boolean}
	 */
	connectEnds?: boolean;

}

/**
 * Defines events for [[RadarSeries]].
 */
export interface IRadarSeriesEvents extends ILineSeriesEvents { }

/**
 * Defines adapters for [[RadarSeries]].
 *
 * @see {@link Adapter}
 */
export interface IRadarSeriesAdapters extends ILineSeriesAdapters, IRadarSeriesProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Defines [[Series]] for a radar graph.
 *
 * @see {@link IRadarSeriesEvents} for a list of available Events
 * @see {@link IRadarSeriesAdapters} for a list of available Adapters
 * @todo Example
 * @important
 */
export class RadarSeries extends LineSeries {

	/**
	 * Defines the type of data fields used for the series.
	 *
	 * @type {IRadarSeriesDataFields}
	 */
	public _dataFields: IRadarSeriesDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {IRadarSeriesProperties}
	 */
	public _properties!: IRadarSeriesProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IRadarSeriesAdapters}
	 */
	public _adapter!: IRadarSeriesAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IRadarSeriesEvents}
	 */
	public _events!: IRadarSeriesEvents;

	/**
	 * Defines the type of data item.
	 *
	 * @type {RadarSeriesDataItem}
	 */
	public _dataItem: RadarSeriesDataItem;

	/**
	 * A chart series belongs to.
	 *
	 * @type {RadarChart}
	 */
	public _chart: RadarChart;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "RadarSeries";
		this.connectEnds = true;
		this.applyTheme();
	}

	/**
	 * (Re)validates the whole series, effectively causing it to redraw.
	 *
	 * @ignore Exclude from docs
	 */
	public validate(): void {

		// so that radius would be updated
		if (this.chart.invalid) {
			this.chart.validate();
		}

		super.validate();
	}

	/**
	 * Returns a new/empty DataItem of the type appropriate for this object.
	 *
	 * @see {@link DataItem}
	 * @return {RadarSeriesDataItem} Data Item
	 */
	protected createDataItem(): this["_dataItem"] {
		return new RadarSeriesDataItem();
	}

	/**
	 * [getPoint description]
	 *
	 * @todo Description
	 * @param {RadarSeriesDataItem} dataItem  [description]
	 * @param {string}              xKey      [description]
	 * @param {string}              yKey      [description]
	 * @param {number}              locationX [description]
	 * @param {number}              locationY [description]
	 * @param {string}              stackKeyX [description]
	 * @param {string}              stackKeyY [description]
	 */
	protected getPoint(dataItem: RadarSeriesDataItem, xKey: string, yKey: string, locationX?: number, locationY?: number, stackKeyX?: string, stackKeyY?: string) {
		if (!stackKeyX) {
			stackKeyX = "valueX";
		}
		if (!stackKeyY) {
			stackKeyY = "valueY";
		}

		let x: number = this.yAxis.getX(dataItem, yKey, locationY, stackKeyY);
		let y: number = this.yAxis.getY(dataItem, yKey, locationY, stackKeyY);

		let radius: number = $math.getDistance({ x: x, y: y });

		let angle: number = this.xAxis.getAngle(dataItem, xKey, locationX, stackKeyX);

		let startAngle = this.chart.startAngle;
		let endAngle = this.chart.endAngle;

		//		angle = $math.fitToRange(angle, startAngle, endAngle);

		if (angle < startAngle || angle > endAngle) {
			return undefined;
		}
		else {
			return { x: radius * $math.cos(angle), y: radius * $math.sin(angle) };
		}
	}


	/**
	 * [addPoints description]
	 *
	 * @todo Description
	 * @param {IPoint[]}          points    [description]
	 * @param {this["_dataItem"]} dataItem  [description]
	 * @param {string}            xField    [description]
	 * @param {string}            yField    [description]
	 * @param {boolean}           backwards [description]
	 */
	protected addPoints(points: IPoint[], dataItem: this["_dataItem"], xField: string, yField: string, backwards?: boolean): void {
		let point = this.getPoint(dataItem, xField, yField, dataItem.locations[xField], dataItem.locations[yField]);
		if (point) {
			points.push(point);
		}
	}

	/**
	 * Returns an SVG path to be used as a mask for the series.
	 *
	 * @return {string} SVG path
	 */
	protected getMaskPath(): string {
		let renderer: AxisRendererRadial = <AxisRendererRadial>this.yAxis.renderer;
		return $path.arc(renderer.startAngle, renderer.endAngle - renderer.startAngle, renderer.pixelRadius, renderer.pixelInnerRadius);
	}

	/**
	 * [drawSegment description]
	 *
	 * @todo Description
	 * @param {LineSeriesSegment}  segment      [description]
	 * @param {IPoint[]}           points       [description]
	 * @param {IPoint[]}           closePoints  [description]
	 */
	protected drawSegment(segment: LineSeriesSegment, points: IPoint[], closePoints: IPoint[]): void {
		let axis: Axis = this.yAxis;
		let renderer: AxisRendererRadial = <AxisRendererRadial>axis.renderer;

		if (this.connectEnds && Math.abs(renderer.endAngle - renderer.startAngle) == 360) {
			// adds one point to the beginning of closePoints array, if needed
			if (this.dataFields[<keyof this["_dataFields"]>this._xOpenField] ||
				this.dataFields[<keyof this["_dataFields"]>this._yOpenField] ||
				this.stacked) {
				points.push(points[0]);
				if (closePoints.length > 0) {
					closePoints.unshift(closePoints[closePoints.length - 1]);
				}
			}
		}
		super.drawSegment(segment, points, closePoints);
	}

	/**
	 * Should the last and and first data points be connected, forming a complete
	 * closed circle?
	 *
	 * @default true
	 * @param {boolean}  value  Connect?
	 */
	public set connectEnds(value: boolean) {
		this.setPropertyValue("connectEnds", value);
		this.invalidateDataRange();
	}

	/**
	 * @return {boolean} Connect?
	 */
	public get connectEnds(): boolean {
		return this.getPropertyValue("connectEnds");
	}
}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["RadarSeries"] = RadarSeries;
registry.registeredClasses["RadarSeriesDataItem"] = RadarSeriesDataItem;
