const fs = require('fs');

const filePath = 'c:\\\\Users\\\\HP\\\\OneDrive\\\\Desktop\\\\CODES\\\\sikola-app\\\\src\\\\screens\\\\SubjectDetailScreen.js';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// The end of the scroll view
const scrollEndMarker = `              <View style={{ height: verticalScale(140) }} />\n            </ScrollView>\n          </>\n         )}\n      </SafeAreaView>`;

const new_scroll_end = `              <View style={{ height: verticalScale(140) }} />\n              </View>\n              )}\n            </View>\n\n          </View>\n        </ScrollView>\n      </SafeAreaView>`;

if (content.includes(scrollEndMarker)) {
    content = content.replace(scrollEndMarker, new_scroll_end);
} else {
    console.error("Failed to replace scrollEndMarker");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed end of scrollview!');
