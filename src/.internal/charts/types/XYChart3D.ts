/**
 * Module for building 3D serial charts.
 */

/**
 * ============================================================================
 * Imports
 * ============================================================================
 * @hidden
 */
import { XYChart, IXYChartProperties, IXYChartDataFields, IXYChartAdapters, IXYChartEvents, XYChartDataItem } from "./XYChart";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { Container } from "../../core/Container";
import { AxisRendererX3D } from "../axes/AxisRendererX3D";
import { AxisRendererY3D } from "../axes/AxisRendererY3D";
import { ColumnSeries3D } from "../series/ColumnSeries3D";
import { registry } from "../../core/Registry";
import * as $iter from "../../core/utils/Iterator";
import * as $math from "../../core/utils/Math";
import * as $type from "../../core/utils/Type";


/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

/**
 * Defines a [[DataItem]] for [[XYChart3D]].
 *
 * @see {@link DataItem}
 */
export class XYChart3DDataItem extends XYChartDataItem {

	constructor() {
		super();
		this.className = "XYChart3DDataItem";
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
 * Defines data fields for [[XYChart3D]].
 */
export interface IXYChart3DDataFields extends IXYChartDataFields { }

/**
 * Defines available properties for [[XYChart3D]].
 */
export interface IXYChart3DProperties extends IXYChartProperties {

	/**
	 * Depths of the chart in pixels.
	 *
	 * @type {number}
	 */
	depth?: number;

	/**
	 * Angle the chart is viewed at.
	 *
	 * @type {number}
	 */
	angle?: number;

}

/**
 * Defines events for [[XYChart3D]].
 */
export interface IXYChart3DEvents extends IXYChartEvents { }

/**
 * Defines adapters for [[XYChart3D]].
 *
 * @see {@link Adapter}
 */
export interface IXYChart3DAdapters extends IXYChartAdapters, IXYChart3DProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Creates a 3D XY chart.
 *
 * @see {@link IXYChart3DEvents} for a list of available Events
 * @see {@link IXYChart3DAdapters} for a list of available Adapters
 * @see {@link https://www.amcharts.com/docs/v4/chart-types/xy-chart/} for documentation
 * @important
 */
export class XYChart3D extends XYChart {

	/**
	 * Available data fields.
	 *
	 * @type {IXYChart3DDataFields}
	 */
	public _dataFields: IXYChart3DDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {IXYChart3DProperties}
	 */
	public _properties!: IXYChart3DProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IXYChart3DAdapters}
	 */
	public _adapter!: IXYChart3DAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IXYChart3DEvents}
	 */
	public _events!: IXYChart3DEvents;

	/**
	 * Type of the axis renderer to use for X axes.
	 *
	 * @type {[type]}
	 */
	protected _axisRendererX: typeof AxisRendererX3D = AxisRendererX3D;

	/**
	 * Type of the axis renderer to use for Y axes.
	 * @type {[type]}
	 */
	protected _axisRendererY: typeof AxisRendererY3D = AxisRendererY3D;

	/**
	 * A container to add 3D column elements to.
	 *
	 * @ignore Exclude from docs
	 * @type {Container}
	 */
	public columnsContainer: Container;

	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "XYChart3D";

		// Set defaults
		this.depth = 30;
		this.angle = 30;

		// Creeate container for columns
		let columnsContainer = this.seriesContainer.createChild(Container);
		columnsContainer.shouldClone = false;
		columnsContainer.isMeasured = false;
		columnsContainer.layout = "none";
		this.columnsContainer = columnsContainer;

		// Apply theme
		this.applyTheme();

	}

	/**
	 * Depth of the 3D chart / columns in pixels.
	 *
	 * @param {number}  value  Depth (px)
	 */
	public set depth(value: number) {
		this.setPropertyValue("depth", value);
		this.fixLayout();
		this.invalidateDataUsers();
	}

	/**
	 * @return {number} Depth (px)
	 */
	public get depth(): number {
		return this.getPropertyValue("depth");
	}

	/**
	 * Angle the chart is viewed at.
	 *
	 * @todo Description (review)
	 * @param {number}  value  Angle
	 */
	public set angle(value: number) {
		this.setPropertyValue("angle", value);
		this.fixLayout();
		this.invalidateDataUsers();
	}

	/**
	 * @return {number} Angle
	 */
	public get angle(): number {
		return this.getPropertyValue("angle");
	}

	/**
	 * A calculated horizontal 3D offset (px).
	 *
	 * @readonly
	 * @return {number} Offset (px)
	 */
	public get dx3D(): number {
		return $math.cos(this.angle) * this.depth;
	}

	/**
	 * A calculated vertical 3D offset (px).
	 *
	 * @readonly
	 * @return {number} Offset (px)
	 */
	public get dy3D(): number {
		return -$math.sin(this.angle) * this.depth;
	}

	/**
	 * (Re)validates the chart.
	 *
	 * @ignore Exclude from docs
	 */
	public validate() {
		super.validate();
		this.fixLayout();
	}

	/**
	 * Updates the layout (padding and scrollbar positions) to accommodate for
	 * 3D depth and angle.
	 */
	protected fixLayout(): void {
		this.chartContainer.marginTop = -this.dy3D;
		this.chartContainer.paddingRight = this.dx3D;

		if (this.scrollbarX) {
			this.scrollbarX.dy = this.dy3D;
			this.scrollbarX.dx = this.dx3D;
		}

		if (this.scrollbarY) {
			this.scrollbarY.dy = this.dy3D;
			this.scrollbarY.dx = this.dx3D;
		}

		this.fixColumns();
	}

	/**
	 * Updates column positions, offset and dimensions based on chart's angle
	 * and depth.
	 */
	protected fixColumns(): void {
		let count: number = 1;

		$iter.each(this.series.iterator(), (series) => {
			if (series instanceof ColumnSeries3D) {

				if (!series.clustered) {
					count++;
				}

				series.depthIndex = count - 1;
			}
		});

		let s: number = 0;

		$iter.each(this.series.iterator(), (series) => {
			if (series instanceof ColumnSeries3D) {

				series.depth = this.depth / count;
				series.angle = this.angle;
				series.dx = this.depth / count * $math.cos(this.angle) * series.depthIndex;
				series.dy = -this.depth / count * $math.sin(this.angle) * series.depthIndex;

				let i: number = 1;

				$iter.each(series.columns.iterator(), (column) => {
					column.zIndex = 1000 * i + s - series.depthIndex * 100;
					i++;
				});

				s++;
			}
		});
	}

	/**
	 * Processes JSON-based config before it is applied to the object.
	 *
	 * @ignore Exclude from docs
	 * @param {object}  config  Config
	 */
	public processConfig(config?: { [index: string]: any }): void {

		if (config) {

			// Set up series
			if ($type.hasValue(config.series) && $type.isArray(config.series)) {
				for (let i = 0, len = config.series.length; i < len; i++) {
					config.series[i].type = config.series[i].type || "ColumnSeries3D";
				}
			}

		}

		super.processConfig(config);

	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["XYChart3D"] = XYChart3D;
