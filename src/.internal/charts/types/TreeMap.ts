/**
 * TreeMap chart module.
 *
 * Parts of the functionality used in this module are taken from D3.js library
 * (https://d3js.org/)
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { XYChart, IXYChartProperties, IXYChartDataFields, IXYChartAdapters, IXYChartEvents, XYChartDataItem } from "./XYChart";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { percent, Percent } from "../../core/utils/Percent";
import { DataItem, IDataItemEvents } from "../../core/DataItem";
import { List, ListTemplate, IListEvents } from "../../core/utils/List";
import { Legend, ILegendDataFields, LegendDataItem } from "../Legend";
import { Component, IComponentEvents } from "../../core/Component";
import { registry } from "../../core/Registry";
import { DictionaryTemplate, DictionaryDisposer } from "../../core/utils/Dictionary";
import { ValueAxis } from "../axes/ValueAxis";
import { OrderedListTemplate } from "../../core/utils/SortedList";
import { TreeMapSeries } from "../series/TreeMapSeries";
import { Color } from "../../core/utils/Color";
import { TreeMapSeriesDataItem } from "../series/TreeMapSeries";
import { NavigationBar } from "../elements/NavigationBar";
import { ColorSet } from "../../core/utils/ColorSet";
import { MouseCursorStyle } from "../../core/interaction/Mouse";
import * as $iter from "../../core/utils/Iterator";
import * as $type from "../../core/utils/Type";
import * as $array from "../../core/utils/Array";

/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

/**
 * Defines a [[DataItem]] for [[TreeMap]].
 *
 * @see {@link DataItem}
 */
export class TreeMapDataItem extends XYChartDataItem {

	/**
	 * Defines a type of [[Component]] this data item is used for.
	 *
	 * @type {TreeMap}
	 */
	public _component!: TreeMap;

	/**
	 * A treemap level this data item is displayed at.
	 *
	 * @type {number}
	 */
	protected _level: number;

	/**
	 * Related series.
	 *
	 * @type {TreeMapSeries}
	 */
	protected _series: TreeMapSeries;

	/**
	 * Related series data item.
	 *
	 * @type {TreeMapSeriesDataItem}
	 */
	public seriesDataItem: TreeMapSeriesDataItem;

	/**
	 * Required for squarify functionality.
	 *
	 * @ignore Exclude from docs
	 * @type {TreeMapDataItem[]}
	 */
	public rows: TreeMapDataItem[] = [];

	/**
	 * Required for squarify functionality.
	 *
	 * @ignore Exclude from docs
	 * @type {number}
	 */
	public rowsRatio: number;

	/**
	 * Required for squarify functionality.
	 *
	 * @ignore Exclude from docs
	 * @type {boolean}
	 */
	public dice: boolean;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "TreeMapDataItem";

		this.values.value = {};

		this.values.x0 = {};

		this.values.y0 = {};

		this.values.x1 = {};

		this.values.y1 = {};

		this.hasChildren.children = true;

		this.applyTheme();
	}

	/**
	 * Numeric value of the item.
	 *
	 * @param {number}  value  Value
	 */
	public set value(value: number) {
		this.setValue("value", value);
	}

	/**
	 * @return {number} Value
	 */
	public get value(): number {
		let value = this.values["value"].value;

		if (!$type.isNumber(value)) {
			value = 0;
			if (this.children) {
				$iter.each(this.children.iterator(), (child) => {
					if ($type.isNumber(child.value)) {
						value += child.value;
					}
				});
			}
		}
		return value;
	}

	/**
	 * Item's X position.
	 *
	 * @ignore Exclude from docs
	 * @todo Description (review)
	 * @param {number}  value  X
	 */
	public set x0(value: number) {
		this.setValue("x0", value);
	}

	/**
	 * @return {number} X
	 */
	public get x0(): number {
		return this.values.x0.value;
	}

	/**
	 * Item's X position.
	 *
	 * @ignore Exclude from docs
	 * @todo Description (review)
	 * @param {number}  value  X
	 */
	public set x1(value: number) {
		this.setValue("x1", value);
	}

	/**
	 * @return {number} X
	 */
	public get x1(): number {
		return this.values.x1.value;
	}

	/**
	 * Item's Y position.
	 *
	 * @ignore Exclude from docs
	 * @todo Description (review)
	 * @param {number}  value  Y
	 */
	public set y0(value: number) {
		this.setValue("y0", value);
	}

	/**
	 * @return {number} Y
	 */
	public get y0(): number {
		return this.values.y0.value;
	}

	/**
	 * Item's Y position.
	 *
	 * @ignore Exclude from docs
	 * @todo Description (review)
	 * @param {number}  value  Y
	 */
	public set y1(value: number) {
		this.setValue("y1", value);
	}

	/**
	 * @return {number} Y
	 */
	public get y1(): number {
		return this.values.y1.value;
	}

	/**
	 * Item's name.
	 *
	 * @param {string}  name  Name
	 */
	public set name(name: string) {
		this.setProperty("name", name);
	}

	/**
	 * @return {string} Name
	 */
	public get name(): string {
		return this.properties.name;
	}

	/**
	 * A list of item's sub-children.
	 *
	 * Having children means that the TreeMap chat will automatically be
	 * "drillable". Clicking on an item with children will zoom to the item, then
	 * display its children.
	 *
	 * Treemap can have any level of nesting.
	 *
	 * @param {OrderedListTemplate<TreeMapDataItem>}  children  Item's children
	 */
	public set children(children: OrderedListTemplate<TreeMapDataItem>) {
		this.setProperty("children", children);
	}

	/**
	 * @return {OrderedListTemplate<TreeMapDataItem>} Item's children
	 */
	public get children(): OrderedListTemplate<TreeMapDataItem> {
		return this.properties.children;
	}

	/**
	 * Depth level in the treemap hierarchy.
	 *
	 * The top-level item will have level set at 0. Its children will have
	 * level 1, and so on.
	 *
	 * @readonly
	 * @return {number} Level
	 */
	public get level(): number {
		if (!this.parent) {
			return 0;
		}
		else {
			return this.parent.level + 1;
		}
	}

	/**
	 * Item's color.
	 *
	 * If not set, will use parent's color, or, if that is not set either,
	 * automatically assigned color from chart's color set. (`chart.colors`)
	 *
	 * @param {Color}  value  Color
	 */
	public set color(value: Color) {
		this.setProperty("color", value);
	}

	/**
	 * @return {Color} Color
	 */
	public get color(): Color {
		let color = this.properties.color;

		if (color == undefined) {
			if (this.parent) {
				color = this.parent.color;
			}
		}
		if (color == undefined) {
			if (this.component) {
				color = this.component.colors.getIndex(this.component.colors.step * this.index);
			}
		}
		return color;
	}

	/**
	 * series of data item
	 * @todo: proper descrition
	 */
	public set series(series: TreeMapSeries) {
		if (this._series) {
			this.component.series.removeValue(this._series);
			this._series.dispose();
		}
		this._series = series;
		this._disposers.push(series);
	}

	public get series(): TreeMapSeries {
		return this._series;
	}
}


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines data fields for [[TreeMap]].
 */
export interface ITreeMapDataFields extends IXYChartDataFields {

	/**
	 * A name of the field in data that holds item's numeric value.
	 *
	 * @type {string}
	 */
	value?: string;

	/**
	 * A name of the field in data that holds item's sub-items.
	 *
	 * @type {string}
	 */
	children?: string;

	/**
	 * A name of the field in data that holds item's name.
	 *
	 * @type {string}
	 */
	name?: string;

	/**
	 * A name of the field in data that holds item's color.
	 *
	 * If not set, a new color will be automatically assigned to each item as
	 * defined by theme.
	 *
	 * @type {string}
	 */
	color?: string;

}

/**
 * Defines properties for [[TreeMap]].
 */
export interface ITreeMapProperties extends IXYChartProperties {

	/**
	 * Maximum levels the chart will allow drilling down to.
	 *
	 * @default 2
	 * @type {number}
	 */
	maxLevels?: number;

	/**
	 * Current drill-down level the treemap is at.
	 *
	 * @type {number}
	 */
	currentLevel?: number;

	/**
	 * Sorting direction of treemap items.
	 *
	 * @default "descending"
	 * @type {"none" | "ascending" | "descending"}
	 */
	sorting?: "none" | "ascending" | "descending";

}

/**
 * Defines events for [[TreeMap]].
 */
export interface ITreeMapEvents extends IXYChartEvents { }

/**
 * Defines adapters for [[TreeMap]].
 *
 * @see {@link Adapter}
 */
export interface ITreeMapAdapters extends IXYChartAdapters, ITreeMapProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Creates a TreeMap chart.
 *
 * @see {@link ITreeMapEvents} for a list of available Events
 * @see {@link ITreeMapAdapters} for a list of available Adapters
 * @see {@link https://www.amcharts.com/docs/v4/chart-types/treemap/} for documentation
 */
export class TreeMap extends XYChart {

	/**
	 * Defines a type of the data item used for this chart.
	 *
	 * @type {TreeMapDataItem}
	 */
	public _dataItem: TreeMapDataItem;

	/**
	 * Defines available data fields.
	 *
	 * @type {ITreeMapDataFields}
	 */
	public _dataFields: ITreeMapDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {ITreeMapProperties}
	 */
	public _properties!: ITreeMapProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {SeriesAdapters}
	 */
	public _adapter!: ITreeMapAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {ITreeMapEvents}
	 */
	public _events!: ITreeMapEvents;

	/**
	 * A horizontal value axis.
	 *
	 * TreeMap chart is basically an XY chart, which means it has vertical and
	 * horizontal value axes.
	 *
	 * As with any XY-based chart, it can be zoomed.
	 *
	 * @type {ValueAxis}
	 */
	public xAxis: ValueAxis;

	/**
	 * A vertical value axis.
	 *
	 * TreeMap chart is basically an XY chart, which means it has vertical and
	 * horizontal value axes.
	 *
	 * As with any XY-based chart, it can be zoomed.
	 *
	 * @type {ValueAxis}
	 */
	public yAxis: ValueAxis;

	/**
	 * An algorithm used to divide area into squares based on their value.
	 *
	 * Available options: squarify (default), binaryTree, slice, dice, sliceDice.
	 *
	 * ```TypeScript
	 * chart.layoutAlgorithm = chart.sliceDice;
	 * ```
	 * ```JavaScript
	 * chart.layoutAlgorithm = chart.sliceDice;
	 * ```
	 * ```JSON
	 * {
	 *   // ...
	 *   "layoutAlgorithm": "sliceDice",
	 *   // ...
	 * }
	 * ```
	 *
	 * @see {@link https://www.amcharts.com/docs/v4/chart-types/treemap/#Area_division_methods} For more info and examples.
	 * @default squarify
	 * @type {function}
	 */
	public layoutAlgorithm: (parent: TreeMapDataItem) => void = this.squarify;

	/**
	 * Defines a type of series that this chart uses.
	 *
	 * @type {PieSeries}
	 */
	public _seriesType: TreeMapSeries;

	/**
	 * [_homeDataItem description]
	 *
	 * @todo Description
	 * @type {TreeMapDataItem}
	 */
	protected _homeDataItem: TreeMapDataItem;

	/**
	 * [_tempSeries description]
	 *
	 * @todo Description
	 * @type {TreeMapSeries[]}
	 */
	protected _tempSeries: TreeMapSeries[];

	/**
	 * A text dispalyed on the home button in breadcurmb nav control.
	 *
	 * @type {string}
	 */
	protected _homeText: string;

	/**
	 * A set of colors to be applied autoamtically to each new chart item, if
	 * not explicitly set.
	 *
	 * @type {ColorSet}
	 */
	public colors: ColorSet;

	/**
	 * Holds series object for each TreeMap level.
	 *
	 * "0" is the top-level series.
	 * "1" is the second level.
	 * Etc.
	 *
	 * @todo Description
	 * @param {DictionaryTemplate<string, TreeMapSeries>} Templates for each level
	 */
	public seriesTemplates: DictionaryTemplate<string, this["_seriesType"]>;

	/**
	 * Is the chart zoomable?
	 *
	 * If the chart is `zoomable`, and items have sub-items, the chart will
	 * drill-down to sub-items when click on their parent item.
	 *
	 * @default true
	 * @type {boolean}
	 */
	public zoomable: boolean = true;


	/**
	 * A navigation bar used to show "breadcrumb" control, indicating current
	 * drill-down path.
	 *
	 * @type {NavigationBar}
	 */
	protected _navigationBar: NavigationBar;

	/**
	 * Currently selected data item.
	 * @type {TreeMapDataItem}
	 * @readonly
	 */
	public currentlyZoomed: TreeMapDataItem;

	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "TreeMap";

		this.maxLevels = 2;
		this.currentLevel = 0;

		this.colors = new ColorSet();
		this.sorting = "descending";

		// create two value axes for the chart
		let xAxis = this.xAxes.push(new ValueAxis<this["_xAxisRendererType"]>());
		xAxis.title.disabled = true;
		xAxis.strictMinMax = true;

		let xRenderer = xAxis.renderer;
		xRenderer.inside = true;
		xRenderer.labels.template.disabled = true;
		xRenderer.ticks.template.disabled = true;
		xRenderer.grid.template.disabled = true;
		xRenderer.axisFills.template.disabled = true;
		xRenderer.minGridDistance = 100;
		xRenderer.line.disabled = true;
		xRenderer.baseGrid.disabled = true;
		//xRenderer.inversed = true;

		let yAxis = this.yAxes.push(new ValueAxis<this["_yAxisRendererType"]>());
		yAxis.title.disabled = true;
		yAxis.strictMinMax = true;

		let yRenderer = yAxis.renderer;
		yRenderer.inside = true;
		yRenderer.labels.template.disabled = true;
		yRenderer.ticks.template.disabled = true;
		yRenderer.grid.template.disabled = true;
		yRenderer.axisFills.template.disabled = true;
		yRenderer.minGridDistance = 100;
		yRenderer.line.disabled = true;
		yRenderer.baseGrid.disabled = true;
		yRenderer.inversed = true;

		this.events.on("maxsizechanged", () => {
			if (this.inited) {
				this.invalidateLayout();
			}
		}, undefined, false);

		// shortcuts
		this.xAxis = xAxis;
		this.yAxis = yAxis;

		const template = new TreeMapSeries();
		this.seriesTemplates = new DictionaryTemplate<string, this["_seriesType"]>(template);
		this._disposers.push(new DictionaryDisposer(this.seriesTemplates));
		this._disposers.push(template);

		this.zoomOutButton.events.on("hit", () => {
			this.zoomToChartDataItem(this._homeDataItem);
		}, undefined, false)

		this.seriesTemplates.events.on("insertKey", (event) => {
			event.newValue.isTemplate = true;
		}, undefined, false)

		// Apply theme
		this.applyTheme();
	}

	/**
	 * A navigation bar used to show "breadcrumb" control, indicating current
	 * drill-down path.
	 *
	 * @type {NavigationBar}
	 */
	public set navigationBar(navigationBar: NavigationBar) {
		if (this._navigationBar != navigationBar) {
			this._navigationBar = navigationBar;
			navigationBar.parent = this;
			navigationBar.toBack();
			navigationBar.links.template.events.on("hit", (event) => {
				let dataItem = <TreeMapDataItem>event.target.dataItem.dataContext;
				this.zoomToChartDataItem(dataItem);
				this.createTreeSeries(dataItem);
			}, undefined, true);

			this._disposers.push(navigationBar);
		}
	}

	/**
	 * Returns navigationBar if it is added to a chart
	 */
	public get navigationBar(): NavigationBar {
		return this._navigationBar;
	}


	/**
	 * (Re)validates chart's data.
	 *
	 * @ignore Exclude from docs
	 */
	public validateData(): void {

		this.series.clear();

		super.validateData();

		if (this._homeDataItem) {
			this._homeDataItem.dispose();
		}

		let homeDataItem = this.dataItems.template.clone(); // cant' use createDataItem here!

		this._homeDataItem = homeDataItem;

		$iter.each(this.dataItems.iterator(), (dataItem) => {
			dataItem.parent = homeDataItem;
		});

		homeDataItem.children = this.dataItems;

		homeDataItem.x0 = 0;
		homeDataItem.y0 = 0;
		homeDataItem.name = this._homeText;

		let maxX = 1000;
		let maxY = (maxX * this.pixelHeight / this.pixelWidth) || 1000;

		homeDataItem.x1 = maxX;
		homeDataItem.y1 = maxY;

		this.xAxis.min = 0;
		this.xAxis.max = maxX;

		this.yAxis.min = 0;
		this.yAxis.max = maxY;

		this.layoutItems(homeDataItem);

		this.createTreeSeries(homeDataItem);
	}

	/**
	 * Layouts and sizes all items according to their value and
	 * `layoutAlgorithm`.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Parent data item
	 */
	public layoutItems(parent: TreeMapDataItem, sorting?: "none" | "ascending" | "descending"): void {
		if (parent) {
			let children = parent.children;

			if (!sorting) {
				sorting = this.sorting;
			}

			if (sorting == "ascending") {
				children.values.sort((a, b) => {
					return a.value - b.value;
				});
			}
			if (sorting == "descending") {
				children.values.sort((a, b) => {
					return b.value - a.value;
				});
			}

			this.layoutAlgorithm(parent);

			for (let i = 0, len = children.length; i < len; i++) {

				let node = children.getIndex(i);

				if (node.children) {
					this.layoutItems(node);
				}
			}
		}
	}


	/**
	 * Creates and returns a new treemap series.
	 *
	 * @todo Description
	 * @param {TreeMapDataItem}  dataItem  Data item to create series out of
	 */
	protected createTreeSeries(dataItem: TreeMapDataItem) {
		this._tempSeries = [];

		let navigationData = [dataItem];

		// create parent series and navigation data
		let parentDataItem = dataItem.parent;
		while (parentDataItem != undefined) {
			this.initSeries(parentDataItem);
			navigationData.push(parentDataItem);
			parentDataItem = parentDataItem.parent;
		}

		navigationData.reverse();

		if (this.navigationBar) {
			this.navigationBar.data = navigationData;
		}

		// create series and children series
		this.createTreeSeriesReal(dataItem);

		// add those which are not in the list
		$array.each(this._tempSeries, (series) => {
			if (this.series.indexOf(series) == -1) {
				this.series.push(series);
			}
			series.zIndex = series.level;
		})
	}

	/**
	 * [createTreeSeriesReal description]
	 *
	 * @todo Description
	 * @param {TreeMapDataItem} dataItem [description]
	 */
	protected createTreeSeriesReal(dataItem: TreeMapDataItem) {
		if (dataItem.children) {
			let level = dataItem.level;

			if (level < this.currentLevel + this.maxLevels) {

				this.initSeries(dataItem);

				for (let i = 0; i < dataItem.children.length; i++) {
					let child = dataItem.children.getIndex(i);
					if (child.children) {
						this.createTreeSeriesReal(child);
					}
				}
			}
		}
	}


	/**
	 * @ignore
	 * Overriding, as tree map series are created on the fly all the time
	 */
	protected seriesAppeared(): boolean {
		return true;
	}


	/**
	 * Initializes the treemap series.
	 *
	 * @todo Description
	 * @param {TreeMapDataItem}  dataItem  Chart data item
	 */
	protected initSeries(dataItem: TreeMapDataItem) {
		if (!dataItem.series) {
			let series: TreeMapSeries;

			let template = this.seriesTemplates.getKey(dataItem.level.toString());
			if (template) {
				series = template.clone();
			}
			else {
				series = this.series.create();
			}

			series.name = dataItem.name;
			series.parentDataItem = dataItem;
			dataItem.series = series;

			let level = dataItem.level;
			series.level = level;

			let dataContext: any = dataItem.dataContext;
			if (dataContext) {
				series.config = dataContext.config;
			}

			this.dataUsers.removeValue(series); // series do not use data directly, that's why we remove it
			series.data = dataItem.children.values;
			series.fill = dataItem.color;

			series.columnsContainer.hide(0);
			series.bulletsContainer.hide(0);

			series.columns.template.adapter.add("fill", (fill, target) => {
				let dataItem = <TreeMapSeriesDataItem>target.dataItem;
				if (dataItem) {
					let treeMapDataItem = dataItem.treeMapDataItem;
					if (treeMapDataItem) {
						target.fill = treeMapDataItem.color;
						target.adapter.remove("fill"); //@todo: make it possible adapters applied once?
						return treeMapDataItem.color;
					}
				}
			});

			if (this.zoomable && (dataItem.level > this.currentLevel || (dataItem.children && dataItem.children.length > 0))) {
				series.columns.template.cursorOverStyle = MouseCursorStyle.pointer;
				if (this.zoomable) {
					series.columns.template.events.on("hit", (event) => {
						let seriesDataItem = <TreeMapSeriesDataItem>event.target.dataItem;

						if (dataItem.level > this.currentLevel) {
							this.zoomToChartDataItem(seriesDataItem.treeMapDataItem.parent);
						}
						else {
							this.zoomToSeriesDataItem(seriesDataItem);
						}

					}, this, undefined);
				}
			}
		}

		this._tempSeries.push(dataItem.series);
	}

	/**
	 * Toggles bullets so that labels that belong to current drill level are
	 * shown.
	 *
	 * @param {number}  duration  Animation duration (ms)
	 */
	protected toggleBullets(duration?: number): void {
		// hide all series which are not in tempSeries
		$iter.each(this.series.iterator(), (series) => {
			if (this._tempSeries.indexOf(series) == - 1) {
				//series.hideReal(duration);
				series.columnsContainer.hide();
				series.bulletsContainer.hide(duration);
			}
			else {
				//series.showReal(duration);
				series.columnsContainer.show();
				series.bulletsContainer.show(duration);

				if (series.level < this.currentLevel) {
					series.bulletsContainer.hide(duration);
				}
			}
		});
	}

	/**
	 * Zooms to particular item in series.
	 *
	 * @param {TreeMapSeriesDataItem}  dataItem  Data item
	 */
	public zoomToSeriesDataItem(dataItem: TreeMapSeriesDataItem): void {
		this.zoomToChartDataItem(dataItem.treeMapDataItem);
	}

	/**
	 * Zooms to particular item.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  dataItem  Data item
	 */
	public zoomToChartDataItem(dataItem: TreeMapDataItem): void {
		if (dataItem && dataItem.children) {
			this.xAxis.zoomToValues(dataItem.x0, dataItem.x1);
			this.yAxis.zoomToValues(dataItem.y0, dataItem.y1);

			this.currentLevel = dataItem.level;
			this.currentlyZoomed = dataItem;

			this.createTreeSeries(dataItem);

			let rangeChangeAnimation = this.xAxis.rangeChangeAnimation || this.yAxis.rangeChangeAnimation;
			this._dataDisposers.push(rangeChangeAnimation);
			if (rangeChangeAnimation && !rangeChangeAnimation.isFinished()) {
				rangeChangeAnimation.events.once("animationended", () => {
					this.toggleBullets();
				})
			}
			else {
				this.toggleBullets();
			}
		}
	}

	/**
	 * Sets defaults that instantiate some objects that rely on parent, so they
	 * cannot be set in constructor.
	 */
	protected applyInternalDefaults(): void {

		super.applyInternalDefaults();

		// Add a default screen reader title for accessibility
		// This will be overridden in screen reader if there are any `titles` set
		if (!$type.hasValue(this.readerTitle)) {
			this.readerTitle = this.language.translate("TreeMap chart");
		}
		//this.homeText = this.language.translate("Home");
	}

	/**
	 * Returns a new/empty DataItem of the type appropriate for this object.
	 *
	 * @see {@link DataItem}
	 * @return {XYSeriesDataItem} Data Item
	 */
	protected createDataItem(): this["_dataItem"] {
		return new TreeMapDataItem();
	}

	/**
	 * Maximum drill-down levels the chart will allow going to.
	 *
	 * If set, the chart will not drill-down further, even if there are sub-items
	 * available.
	 *
	 * Set to `1` to disable drill down functionality.
	 *
	 * @param {number}  value  Maximum drill-down level
	 */
	public set maxLevels(value: number) {
		this.setPropertyValue("maxLevels", value, true);
	}

	/**
	 * @return {number} Maximum drill-down level
	 */
	public get maxLevels(): number {
		return this.getPropertyValue("maxLevels");
	}

	/**
	 * Current drill-down level the chart is at.
	 *
	 * @param {number}  value  Current level
	 */
	public set currentLevel(value: number) {
		this.setPropertyValue("currentLevel", value, true);
	}

	/**
	 * @return {number} Current level
	 */
	public get currentLevel(): number {
		return this.getPropertyValue("currentLevel");
	}

	/**
	 * Sorting direction of treemap items.
	 *
	 * Available options: "none", "ascending", and "descending" (default).
	 *
	 * @default "descending"
	 * @param {"none" | "ascending" | "descending"} value [description]
	 */
	public set sorting(value: "none" | "ascending" | "descending") {
		this.setPropertyValue("sorting", value, true);
	}

	public get sorting(): "none" | "ascending" | "descending" {
		return this.getPropertyValue("sorting");
	}

	/**
	 * Creates and returns a new series of the suitable type.
	 *
	 * @return {this} new series
	 */
	protected createSeries(): this["_seriesType"] {
		return new TreeMapSeries();
	}

	/**
	 * A text displayed on the "home" button which is used to go back to level 0
	 * after drill into sub-items.
	 *
	 * @param {string}  value  Home text
	 */
	public set homeText(value: string) {
		this._homeText = value;
		if (this._homeDataItem) {
			this._homeDataItem.name = this._homeText;
		}
	}

	/**
	 * @return {string} Home text
	 */
	public get homeText(): string {
		return this._homeText;
	}

	/**
	 * Processes JSON-based config before it is applied to the object.
	 *
	 * @ignore Exclude from docs
	 * @param {object}  config  Config
	 */
	public processConfig(config?: { [index: string]: any }): void {

		if (config) {

			// Instantiate layout algorithm
			if ($type.hasValue(config["layoutAlgorithm"]) && $type.isString(config["layoutAlgorithm"])) {
				switch (config["layoutAlgorithm"]) {
					case "squarify":
						config["layoutAlgorithm"] = this.squarify;
						break;
					case "binaryTree":
						config["layoutAlgorithm"] = this.binaryTree;
						break;
					case "slice":
						config["layoutAlgorithm"] = this.slice;
						break;
					case "dice":
						config["layoutAlgorithm"] = this.dice;
						break;
					case "sliceDice":
						config["layoutAlgorithm"] = this.sliceDice;
						break;
					default:
						delete config["layoutAlgorithm"];
						break;
				}

			}

			// Set type for navigation bar
			if ($type.hasValue(config.navigationBar) && !$type.hasValue(config.navigationBar.type)) {
				config.navigationBar.type = "NavigationBar";
			}

			super.processConfig(config);
		}
	}

	/**
	 * Measures the size of container and informs its children of how much size
	 * they can occupy, by setting their relative `maxWidth` and `maxHeight`
	 * properties.
	 *
	 * @ignore Exclude from docs
	 */
	public validateLayout() {
		super.validateLayout();
		this.layoutItems(this.currentlyZoomed);
	}

	/**
	 * Validates (processes) data items.
	 *
	 * @ignore Exclude from docs
	 */
	public validateDataItems() {
		super.validateDataItems();
		this.layoutItems(this._homeDataItem);

		$iter.each(this.series.iterator(), (series) => {
			series.validateRawData();
		});

		this.zoomToChartDataItem(this._homeDataItem);
	}


	/**
	 * ==========================================================================
	 * TREEMAP LAYOUT FUNCTIONS
	 * ==========================================================================
	 * @hidden
	 */

	/**
	 * The functions below are from D3.js library (https://d3js.org/)
	 *
	 * --------------------------------------------------------------------------
	 * Copyright 2017 Mike Bostock
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are met:
	 *
	 * 1. Redistributions of source code must retain the above copyright notice,
	 *    this list of conditions and the following disclaimer.
	 *
	 * 2. Redistributions in binary form must reproduce the above copyright
	 *    notice,this list of conditions and the following disclaimer in the
	 *    documentation and/or other materials provided with the distribution.
	 *
	 * 3. Neither the name of the copyright holder nor the names of its
	 *    contributors may be used to endorse or promote products derived from
	 *    this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
	 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
	 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
	 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
	 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
	 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
	 * POSSIBILITY OF SUCH DAMAGE.
	 * --------------------------------------------------------------------------
	 * @hidden
	 */

	/**
	 * Treemap layout algorithm: binaryTree.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Data item
	 */
	public binaryTree(parent: TreeMapDataItem): void {
		let nodes = parent.children,
			i, n = nodes.length,
			sum, sums = new Array(n + 1);

		for (sums[0] = sum = i = 0; i < n; ++i) {
			sums[i + 1] = sum += nodes.getIndex(i).value;
		}

		partition(0, n, parent.value, parent.x0, parent.y0, parent.x1, parent.y1);

		function partition(i: number, j: number, value: number, x0: number, y0: number, x1: number, y1: number) {
			if (i >= j - 1) {
				let node = nodes.getIndex(i);
				node.x0 = x0, node.y0 = y0;
				node.x1 = x1, node.y1 = y1;
				return;
			}

			let valueOffset = sums[i],
				valueTarget = (value / 2) + valueOffset,
				k = i + 1,
				hi = j - 1;

			while (k < hi) {
				let mid = k + hi >>> 1;
				if (sums[mid] < valueTarget) k = mid + 1;
				else hi = mid;
			}

			if ((valueTarget - sums[k - 1]) < (sums[k] - valueTarget) && i + 1 < k)--k;

			let valueLeft = sums[k] - valueOffset,
				valueRight = value - valueLeft;

			if ((x1 - x0) > (y1 - y0)) {
				let xk = (x0 * valueRight + x1 * valueLeft) / value;
				partition(i, k, valueLeft, x0, y0, xk, y1);
				partition(k, j, valueRight, xk, y0, x1, y1);
			} else {
				let yk = (y0 * valueRight + y1 * valueLeft) / value;
				partition(i, k, valueLeft, x0, y0, x1, yk);
				partition(k, j, valueRight, x0, yk, x1, y1);
			}
		}
	}

	/**
	 * Treemap layout algorithm: slice.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Data item
	 */
	public slice(parent: TreeMapDataItem): void {
		let x0 = parent.x0;
		let x1 = parent.x1;
		let y0 = parent.y0;
		let y1 = parent.y1;

		let nodes = parent.children,
			node,
			i = -1,
			n = nodes.length,
			k = parent.value && (y1 - y0) / parent.value;

		while (++i < n) {
			node = nodes.getIndex(i), node.x0 = x0, node.x1 = x1;
			node.y0 = y0, node.y1 = y0 += node.value * k;
		}
	}

	/**
	 * Treemap layout algorithm: dice.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Data item
	 */
	public dice(parent: TreeMapDataItem): void {
		let x0 = parent.x0;
		let x1 = parent.x1;
		let y0 = parent.y0;
		let y1 = parent.y1;

		let nodes = parent.children,
			node,
			i = -1,
			n = nodes.length,
			k = parent.value && (x1 - x0) / parent.value;

		while (++i < n) {
			node = nodes.getIndex(i), node.y0 = y0, node.y1 = y1;
			node.x0 = x0, node.x1 = x0 += node.value * k;
		}
	}

	/**
	 * Treemap layout algorithm: slideDice.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Data item
	 */
	public sliceDice(parent: TreeMapDataItem): void {
		parent.level & 1 ? this.slice(parent) : this.dice(parent);
	}

	/**
	 * Treemap layout algorithm: squarify.
	 *
	 * @ignore Exclude from docs
	 * @param {TreeMapDataItem}  parent  Data item
	 */
	public squarify(parent: TreeMapDataItem): void {
		let ratio = (1 + Math.sqrt(5)) / 2;

		let x0 = parent.x0;
		let x1 = parent.x1;
		let y0 = parent.y0;
		let y1 = parent.y1;

		let nodes = parent.children;
		let nodeValue;
		let i0 = 0;
		let i1 = 0;
		let n = nodes.length;
		let dx;
		let dy;
		let value = parent.value;
		let sumValue;
		let minValue;
		let maxValue;
		let newRatio;
		let minRatio;
		let alpha;
		let beta;

		while (i0 < n) {
			dx = x1 - x0, dy = y1 - y0;

			// Find the next non-empty node.
			do sumValue = nodes.getIndex(i1++).value; while (!sumValue && i1 < n);
			minValue = maxValue = sumValue;
			alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
			beta = sumValue * sumValue * alpha;
			minRatio = Math.max(maxValue / beta, beta / minValue);

			// Keep adding nodes while the aspect ratio maintains or improves.
			for (; i1 < n; ++i1) {
				sumValue += nodeValue = nodes.getIndex(i1).value;
				if (nodeValue < minValue) {
					minValue = nodeValue;
				}
				if (nodeValue > maxValue) {
					maxValue = nodeValue;
				}
				beta = sumValue * sumValue * alpha;
				newRatio = Math.max(maxValue / beta, beta / minValue);
				if (newRatio > minRatio) {
					sumValue -= nodeValue; break;
				}
				minRatio = newRatio;
			}

			// Position and record the row orientation.
			let row = this.dataItems.template.clone();
			row.value = sumValue;
			row.dice = dx < dy;
			row.children = nodes.slice(i0, i1);
			row.x0 = x0;
			row.y0 = y0;
			row.x1 = x1;
			row.y1 = y1;

			if (row.dice) {
				row.y1 = value ? y0 += dy * sumValue / value : y1;
				this.dice(row);
			}
			else {
				row.x1 = value ? x0 += dx * sumValue / value : x1, y1;
				this.slice(row);
			}
			value -= sumValue, i0 = i1;
		}
	}

	/**
	 * [handleDataItemValueChange description]
	 *
	 * @ignore Exclude from docs
	 * @todo Description
	 */
	public handleDataItemValueChange(dataItem?: this["_dataItem"]): void {
		this.invalidateDataItems();
	}

	/**
	 * Setups the legend to use the chart's data.
	 */
	protected feedLegend(): void {
		let legend = this.legend;
		if (legend) {
			let legendData: Array<this["_seriesType"]> = [];

			$iter.each(this.series.iterator(), (series) => {
				if (series.level == 1) {
					legendData.push(series);
				}
			});

			legend.dataFields.name = "name";
			legend.itemContainers.template.propertyFields.disabled = "hiddenInLegend";

			legend.data = legendData;
		}
	}

	/**
	 * @ignore
	 */
	public disposeData() {

		super.disposeData();

		this._homeDataItem = undefined;

		this.series.clear();

		if (this.navigationBar) {
			this.navigationBar.disposeData();
		}

		this.xAxis.disposeData();
		this.yAxis.disposeData();
	}

}

/**
 * Register class, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["TreeMap"] = TreeMap;
