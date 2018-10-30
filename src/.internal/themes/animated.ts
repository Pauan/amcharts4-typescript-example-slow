import { ITheme } from "./ITheme";
import { SpriteState } from "../core/SpriteState";
import { Component } from "../core/Component";
import { BaseObject } from "../core/Base";
import { Scrollbar } from "../core/elements/Scrollbar";
import { Tooltip } from "../core/elements/Tooltip";
import { Series } from "../charts/series/Series";
import { PercentSeries } from "../charts/series/PercentSeries";
import { SankeyDiagram } from "../charts/types/SankeyDiagram";
import { FunnelSeries } from "../charts/series/FunnelSeries";
import { FunnelSlice } from "../charts/elements/FunnelSlice";
import { Column } from "../charts/elements/Column";
import { Slice } from "../core/elements/Slice";
import { Preloader } from "../core/elements/Preloader";
import { Chart } from "../charts/Chart";



const theme: ITheme = (object: BaseObject) => {
	if (object instanceof SpriteState) {
		object.transitionDuration = 400;
	}

	if (object instanceof Component) {
		object.rangeChangeDuration = 800;
		object.interpolationDuration = 800;
		object.sequencedInterpolation = false;

		if (object instanceof SankeyDiagram) {
			object.sequencedInterpolation = true;
		}

		if (object instanceof FunnelSeries) {
			object.sequencedInterpolation = true;
		}		

	}

	if(object instanceof Chart){
		object.defaultState.transitionDuration = 2000;
		object.hiddenState.transitionDuration = 1000;
		object.hiddenState.properties.opacity = 1;
	}

	if (object instanceof Tooltip) {
		object.animationDuration = 400;
	}

	if (object instanceof Scrollbar) {
		object.animationDuration = 800;
	}

	if (object instanceof Series) {
		object.defaultState.transitionDuration = 1000;
		object.hiddenState.transitionDuration = 1000;
		object.hiddenState.properties.opacity = 1;
		object.interpolationDuration = 1000;
	}

	if (object instanceof PercentSeries) {
		object.hiddenState.properties.opacity = 0;
	}	

	if (object instanceof FunnelSlice) {
		object.defaultState.transitionDuration = 800;
		object.hiddenState.transitionDuration = 1000;
		object.hiddenState.properties.opacity = 1;
	}

	if (object instanceof Slice) {
		object.defaultState.transitionDuration = 800;
		object.hiddenState.transitionDuration = 1000;
		object.hiddenState.properties.opacity = 1;
	}	

	if (object instanceof Preloader) {
		object.hiddenState.transitionDuration = 2000;
	}		

	if (object instanceof Column) {
		object.defaultState.transitionDuration = 800;
		object.hiddenState.transitionDuration = 1000;
		object.hiddenState.properties.opacity = 1;
	}	
};

export default theme;
