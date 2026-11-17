import {
	type QuestLevel,
	type LevelReward,
	LEVEL_REWARDS,
} from "~~/shared/models/campaigns/christmas";

export function getXPFromLevel<T extends QuestLevel>(level: T): LevelReward<T> {
	return LEVEL_REWARDS[level] as LevelReward<T>;
}
