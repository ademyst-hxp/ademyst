<script setup lang="ts">
import type { ReportNotification } from "#shared/models/inbox";
import Box from "~/components/base/Box.vue";

import { ScaleIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(
	defineProps<{
		scale?: "sm" | "md";
		data: ReportNotification;
	}>(),
	{
		scale: "sm",
	},
);

const reportType = computed(() => {
	if (props.data.postReport) {
		return "post";
	} else if (props.data.profileReport) {
		return "whisper";
	} else if (props.data.whisperReport) {
		return "profile";
	} else {
		return null;
	}
});

const report = computed(() => {
	if (reportType.value === "post") {
		return props.data.postReport;
	} else if (reportType.value === "whisper") {
		return props.data.profileReport;
	} else if (reportType.value === "profile") {
		return props.data.whisperReport;
	} else {
		return null;
	}
});

const reportTypeMap: Record<string, string> = {
	profile: "Profil signalé",
	post: "Publication signalée",
	whisper: "Pensée signalée",
};
</script>
<template>
	<Box :scale="scale" layout="horizontal">
		<div
			class="flex items-center justify-center bg-warning/15 text-warning rounded-full w-12 h-12 mt-2 mr-3 md:w-18 md:h-18"
		>
			<ScaleIcon class="w-6 h-6 md:w-9 md:h-9" />
		</div>

		<div class="flex flex-col gap-2">
			<h4 class="text-lg font-medium font-title" v-if="data.updatedAt">
				Du nouveau sur votre signalement
			</h4>
			<h4 class="text-lg font-medium font-title" v-else>
				Nous avons reçu votre signalement
			</h4>
		</div>
		<div v-if="!data.read" class="bg-info rounded-full w-3 h-3 ml-auto"></div>
	</Box>
</template>
