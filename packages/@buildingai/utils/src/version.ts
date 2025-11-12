/**
 * Building AI version utility.
 * @property validate - Validate whether a version string is compliant.
 * @property format - Normalize a version string into the expected format.
 * @property compare - Compare two version strings to determine which is newer.
 */
export const BdVersion = {
    /**
     * Validate whether a version string adheres to the x.y.z convention.
     * - Format: x.y.z
     * - Each segment is an integer (>=0)
     * - Each segment has at most three digits
     * - No leading zeros (unless the single digit is 0)
     * @example
     * console.log(BdVersion.validate("1.0.3")); // true
     * console.log(BdVersion.validate("001.0.3")); // false
     * @param version - Raw version string to validate.
     * @returns True when the version string is valid.
     */
    validate(version: string): boolean {
        const regex = /^(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})\.(0|[1-9]\d{0,2})$/;
        return regex.test(version);
    },
    /**
     * Normalize a version string by trimming leading zeros and padding segments.
     * - Automatically remove leading zeros from each segment
     * - Ensure three segments (pad with 0 when segments are missing)
     * - Throw an error if any segment exceeds three digits
     * @example
     * console.log(BdVersion.format("01.002.0003")); // "1.2.3"
     * console.log(BdVersion.format("5")); // "5.0.0"
     * @param input - Raw version string to normalize.
     * @returns Normalized version string.
     */
    format(input: string): string {
        const parts = input.split(".");
        if (parts.length > 3) {
            throw new Error("Version cannot contain more than 3 segments (expected format: x.y.z)");
        }

        while (parts.length < 3) parts.push("0");

        const normalized = parts.map((part, i) => {
            if (!/^\d+$/.test(part)) {
                throw new Error(`Segment ${i + 1} is not a valid number: "${part}"`);
            }
            const num = parseInt(part, 10);
            if (num > 999) {
                throw new Error(`Segment ${i + 1} exceeds the maximum allowed value 999`);
            }
            return String(num);
        });

        return normalized.join(".");
    },
    /**
     * Compare two version strings to determine their order.
     * - Normalizes both versions before comparison.
     * - Returns 1 if version1 is newer, -1 if version2 is newer, 0 if equal.
     * - Throws an error if either version is invalid (e.g., non-numeric segments, >3 segments, or segments >999).
     * @example
     * console.log(BdVersion.compare("1.2.3", "1.2.4")); // -1 (second is newer)
     * console.log(BdVersion.compare("2.0.0", "1.10.0")); // 1 (first is newer)
     * console.log(BdVersion.compare("1.0.0", "1.0.0")); // 0
     * @param version1 - First version string to compare.
     * @param version2 - Second version string to compare.
     * @returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal.
     */
    compare(version1: string, version2: string): number {
        const [major1, minor1, patch1] = this.format(version1).split(".").map(Number) as [
            number,
            number,
            number,
        ];
        const [major2, minor2, patch2] = this.format(version2).split(".").map(Number) as [
            number,
            number,
            number,
        ];

        if (major1 !== major2) return major1 > major2 ? 1 : -1;
        if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
        if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
        return 0;
    },
};
