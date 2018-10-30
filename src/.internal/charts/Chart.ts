﻿/**
 * [[Chart]] class provides base functionality for all chart types to inherit.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Component, IComponentProperties, IComponentDataFields, IComponentEvents, IComponentAdapters } from "../core/Component";
import { SpriteEventDispatcher, AMEvent } from "../core/Sprite";
import { registry } from "../core/Registry";
import { ListTemplate, IListEvents, ListDisposer } from "../core/utils/List";
import { Container } from "../core/Container";
import { Label } from "../core/elements/Label";
import { Legend } from "../charts/Legend";
import { DataItem } from "../core/DataItem";
import { percent } from "../core/utils/Percent";
import * as $iter from "../core/utils/Iterator";
import * as $type from "../core/utils/Type";

/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */

/**
 * Defines a [[DataItem]] for [[Chart]].
 *
 * @see {@link DataItem}
 */
export class ChartDataItem extends DataItem {

	/**
	 * Defines a type of [[Component]] this data item is used for.
	 *
	 * @type {Chart}
	 */
	public _component!: Chart;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "ChartDataItem";
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
 * Defines data fields for [[Chart]].
 */
export interface IChartDataFields extends IComponentDataFields { }

/**
 * Defines properties for [[Chart]].
 */
export interface IChartProperties extends IComponentProperties { }

/**
 * Defines events for [[Chart]].
 */
export interface IChartEvents extends IComponentEvents { }

/**
 * Defines adapters for [[Chart]].
 *
 * @see {@link Adapter}
 */
export interface IChartAdapters extends IComponentAdapters, IChartProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * A base class for all Charts.
 *
 * @see {@link IChartEvents} for a list of available Events
 * @see {@link IChartAdapters} for a list of available Adapters
 */
export class Chart extends Component {

	/**
	 * Available data fields.
	 *
	 * @type {IChartDataFields}
	 */
	public _dataFields: IChartDataFields;

	/**
	 * Defines available properties.
	 *
	 * @type {IChartProperties}
	 */
	public _properties!: IChartProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IChartAdapters}
	 */
	public _adapter!: IChartAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IChartEvents}
	 */
	public _events!: IChartEvents;

	/**
	 * A List of chart titles.
	 *
	 * @type {List<Label>}
	 */
	public titles: ListTemplate<Label>;

	/**
	 * Container that holds the chart itself.
	 *
	 * @type {Container}
	 */
	public chartContainer: Container;

	/**
	 * A reference to a container that holds both the chart and the legend.
	 *
	 * @type {Container}
	 */
	public chartAndLegendContainer: Container;

	/**
	 * A reference to chart's [[Legend]].
	 * @ignore
	 * @type {Legend}
	 */
	protected _legend: Legend;

	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "Chart";

		// Create a list of titles
		const template = new Label();
		this.titles = new ListTemplate<Label>(template);
		this._disposers.push(new ListDisposer(this.titles));
		this._disposers.push(template);

		// Chart component is also a container. it holds _chartAndLegendCont and titles
		this.width = percent(100);
		this.height = percent(100);
		this.layout = "vertical";

		// Chart and legend
		let chartAndLegendContainer: Container = this.createChild(Container);
		chartAndLegendContainer.shouldClone = false;
		chartAndLegendContainer.layout = "vertical";
		chartAndLegendContainer.width = percent(100);
		chartAndLegendContainer.height = percent(100);
		this.chartAndLegendContainer = chartAndLegendContainer;

		// Chart container holds all the elements of a chart, extept titles and legend
		let chartContainer = chartAndLegendContainer.createChild(Container);
		chartContainer.shouldClone = false;
		chartContainer.width = percent(100);
		chartContainer.height = percent(100);
		this.chartContainer = chartContainer;

		this.showOnInit = true;

		// Add title list events to apply certain formatting options and to make
		// the chart reference them as accessible screen reader labels
		this.titles.events.on("inserted", (label) => {
			this.processTitle(label);
			this.updateReaderTitleReferences();
		}, this, false);
		this.titles.events.on("removed", (label) => {
			this.updateReaderTitleReferences();
		}, this, false);

		// Accessibility
		// It seems we can't set focusable on the whole chart because it seems to
		// mess up the whole focus event system - getting a focus on an inside
		// object also trigger focus on parent
		//this.focusable = true;
		this.role = "region";

		this.defaultState.transitionDuration = 1;

		// Apply theme
		this.applyTheme();
	}

	/**
	 * Sets defaults that instantiate some objects that rely on parent, so they
	 * cannot be set in constructor.
	 */
	protected applyInternalDefaults(): void {
		super.applyInternalDefaults();
		if (!$type.hasValue(this.readerTitle)) {
			this.readerTitle = this.language.translate("Chart");
		}
	}

	/**
	 * Initiates drawing of the chart.
	 *
	 * @ignore Exclude from docs
	 */
	public draw(): void {
		this.fixLayout();
		super.draw();
	}

	/**
	 * Updates legend's hierarchy based on the position.
	 */
	protected fixLayout(): void {
		let legend = this.legend;
		if (legend) {
			let chartAndLegendContainer = this.chartAndLegendContainer;
			switch (legend.position) {
				case "left":
					chartAndLegendContainer.layout = "horizontal";
					if (!$type.isNumber(legend.width)) {
						legend.width = 200;
					}
					//legend.maxWidth = legend.width;
					legend.toBack();
					break;

				case "right":
					chartAndLegendContainer.layout = "horizontal";
					if (!$type.isNumber(legend.width)) {
						legend.width = 200;
					}
					//legend.maxWidth = legend.width;

					legend.toFront();
					break;

				case "top":
					chartAndLegendContainer.layout = "vertical";
					legend.maxWidth = undefined;
					legend.toBack();
					break;

				case "bottom":
					chartAndLegendContainer.layout = "vertical";
					legend.maxWidth = undefined;
					legend.toFront();
			}
		}
	}

	/**
	 * Setups the legend to use the chart's data.
	 */
	protected feedLegend(): void {

		// Nothing here. This method is provided only as a "placeholder" for
		// extending classes to override

	}

	/**
	 * Adds a new title to the chart when it is inserted into chart's titles
	 * list.
	 * @param  {IListEvents<Label>["inserted"]}  event  An event object which is triggered when inserting into titles list
	 * @return {Label}                               Label object
	 */
	protected processTitle(event: IListEvents<Label>["inserted"]): Label {
		let title: Label = event.newValue;
		title.parent = this;
		title.toBack();
		title.align = "center";

		// Need to explicitly apply the `id` attribute so it can be referenced by
		// `aria-labelledby`
		title.uidAttr();
		return title;
	}

	/**
	 * Checks if chart has any title elements. If it does, we will use them in an
	 * `aria-labelledby` attribute so that screen readers can use them to properly
	 * describe the chart when it is focused or hovered.
	 *
	 * @ignore Exclude from docs
	 */
	public updateReaderTitleReferences(): void {
		if (this.titles.length) {
			let titleIds: Array<string> = [];
			$iter.each(this.titles.iterator(), (title) => {
				titleIds.push(title.uid);
			});
			this.setSVGAttribute({ "aria-labelledby": titleIds.join(" ") });
		}
		else {
			this.removeSVGAttribute("aria-labelledby");
		}
	}


	/**
	 * Holds the instance of chart's [[Leged]].
	 *
	 * @see {@link https://www.amcharts.com/docs/v4/concepts/legend/} for more information about legends
	 * @param {Legend} Legend
	 */
	public set legend(legend: Legend) {
		this.setLegend(legend);
	}

	/**
	 * @return {Legend} Legend
	 */
	public get legend(): Legend {
		return this._legend;
	}

	/**
	 * Prepares the legend instance for use in this chart.
	 *
	 * @param {Legend}  legend  Legend
	 */
	protected setLegend(legend: Legend) {
		if (this._legend != legend) {

			if (this._legend) {
				this.removeDispose(this._legend);
			}

			this._legend = legend;

			if (legend) {
				this._disposers.push(legend);
				// Set legend options
				legend.parent = this.chartAndLegendContainer;
				legend.events.on("propertychanged", (event) => {
					if (event.property == "position" || event.property == "width") {
						this.fixLayout();
					}
				}, undefined, false)
			}

			this.feedLegend();
		}
	}

	/**
	 * Processes JSON-based config before it is applied to the object.
	 *
	 * @ignore Exclude from docs
	 * @param {object}  config  Config
	 */
	public processConfig(config?: { [index: string]: any }): void {

		if (config) {

			// Set up legend
			if ($type.hasValue(config.legend) && !$type.hasValue(config.legend.type)) {
				config.legend.type = "Legend";
			}

		}

		super.processConfig(config);

	}

	/**
	 * Copies all properties from another instance of [[Series]].
	 *
	 * @param {Series}  source  Source series
	 */
	public copyFrom(source: this) {
		this.titles.copyFrom(source.titles);
		if (source.legend) {
			this.legend = source.legend.clone();
		}
		super.copyFrom(source);
	}

}
