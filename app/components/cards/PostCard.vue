<script setup lang="ts">
import { ref, computed, watch } from "vue";

import type { Post } from "~~/shared/models/interactions";

import {
    ExclamationTriangleIcon,
    EyeSlashIcon,
} from "@heroicons/vue/24/outline";

import { SparklesIcon } from "@heroicons/vue/24/solid";

import Card from "../base/Card.vue";
import ProfileRow from "../profile/ProfileRow.vue";
import FlagLabel from "../interactions/labels/FlagLabel.vue";

const props = defineProps<{
    data: Post;
}>();

const { $md } = useNuxtApp();

const isWarningDismissed = ref(false);

watch(
    () => props.data.id,
    () => {
        isWarningDismissed.value = false;
    },
);

const rendered = computed(() => {
    return $md.render(props.data.content);
});

const showSensitiveContent = () => {
    isWarningDismissed.value = true;
};

const hideSensitiveContent = () => {
    isWarningDismissed.value = false;
};
</script>
<template>
    <Card :key="'post-' + data.id" class="shrink-0">
        <div class="flex items-center">
            <ProfileRow :data="data.profile" />
        </div>

        <template v-if="data.flags.NFE && !isWarningDismissed">
            <div
                class="flex flex-col justify-center items-center gap-2 bg-warning/15 border border-warning rounded-xl text-center p-8 -mx-2 md:p-16"
            >
                <ExclamationTriangleIcon
                    class="text-warning h-12 w-12"
                />

                <h2
                    class="text-2xl text-warning font-semibold font-title md:max-w-96"
                >
                    Contenu sensible
                </h2>

                <p class="text-sm md:max-w-96">
                    Cette publication est susceptible de contenir du contenu
                    inadapté à un public non averti. Vous pouvez choisir de la
                    lire ou de l'ignorer.
                </p>

                <Button
                    label="Afficher quand même"
                    variant="warning"
                    :handler="showSensitiveContent"
                />
            </div>
        </template>

        <template v-else>
            <div
                v-if="data.flags.AI"
                class="flex items-center gap-2 text-surface-text-muted px-2 -mb-2"
            >
                <FlagLabel
                    label="Contenu généré par IA"
                    :icon="SparklesIcon"
                />
            </div>

            <div
                class="break-after-all wrap-break-word post-content -mx-2 max-h-72 overflow-x-visible overflow-y-auto"
                v-html="rendered || '<em>Vide.</em>'"
            />
        </template>

        <div
            v-if="data.flags.NFE && isWarningDismissed"
            class="flex items-center gap-1 cursor-pointer text-surface-text-muted px-2"
            @click="hideSensitiveContent"
        >
            <EyeSlashIcon class="h-5 w-5" />
            <span class="text-sm">Masquer le contenu</span>
        </div>
    </Card>
</template>
